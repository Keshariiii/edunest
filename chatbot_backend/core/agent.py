from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain.tools.retriever import create_retriever_tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory

from .config import OPENAI_API_KEY, TAVILY_API_KEY
from .vector_store import get_retriever

# Dictionary to store session histories in memory
store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    """Returns the chat history for a given session."""
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

def get_llm():
    if OPENAI_API_KEY:
        return ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=OPENAI_API_KEY)
    raise ValueError("No LLM API Key found.")

def create_agent():
    """
    Sets up the agent with the PDF retriever tool and Tavily search fallback.
    Returns a RunnableWithMessageHistory.
    """
    llm = get_llm()
    
    tools = []
    
    # 1. PDF Retriever Tool
    retriever = get_retriever()
    if retriever:
        retriever_tool = create_retriever_tool(
            retriever,
            "pdf_search",
            "Search and return information from the uploaded PDFs. Always use this first."
        )
        tools.append(retriever_tool)
        
    # 2. Web Search Tool (Tavily)
    if TAVILY_API_KEY:
        tavily_tool = TavilySearchResults(
            max_results=3,
            description="Use this when you cannot find the answer in the PDFs or if the confidence is low."
        )
        tools.append(tavily_tool)

    # Agent Prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an intelligent AI assistant. Use the provided tools to help the user. "
                   "First, try to find answers using the pdf_search tool. If the information is not there, "
                   "or incomplete, use the web search tool (if available). Always answer concisely and "
                   "cite your sources (whether PDF or Web)."),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    if not tools:
        # Fallback to pure LLM if no tools are available. LangChain agents need at least one tool.
        # We handle this case by returning just the LLM or throwing error. 
        # For simplicity, we raise an error.
        raise ValueError("No tools available. Upload a PDF or add a TAVILY_API_KEY in .env.")

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    agent_with_chat_history = RunnableWithMessageHistory(
        agent_executor,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
    )
    
    return agent_with_chat_history

def get_answer(session_id: str, query: str) -> str:
    agent = create_agent()
    response = agent.invoke(
        {"input": query},
        config={"configurable": {"session_id": session_id}}
    )
    return response["output"]
