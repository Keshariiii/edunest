with open('src/App.jsx', 'r', encoding='utf-8') as f:
    app_lines = f.readlines()

# The broken part in App.jsx starts at line 304 (0-indexed 303, but let's find the exact string)
start_idx = -1
end_idx = -1

for i, line in enumerate(app_lines):
    if '<div className="bg-black border-l-4 border-blue-500 p-4 mt-6 rounded-r-md font-mono text-sm text-gray-300">' in line:
        start_idx = i
        break

for i in range(start_idx, len(app_lines)):
    if app_lines[i].strip() == ')}' and '</div>' in app_lines[i-1]:
        end_idx = i
        break

broken_code = "".join(app_lines[start_idx:end_idx]) # Don't include the final )}

# Now read QuizTab.jsx
with open('src/components/QuizTab.jsx', 'r', encoding='utf-8') as f:
    quiz_lines = f.readlines()

# Find where it broke in QuizTab.jsx
quiz_end_idx = -1
for i, line in enumerate(quiz_lines):
    if line.strip() == ');':
        quiz_end_idx = i
        break

# Stitch it
new_quiz_content = "".join(quiz_lines[:quiz_end_idx]) + broken_code + '\n  );\n};\n\nexport default QuizTab;\n'

with open('src/components/QuizTab.jsx', 'w', encoding='utf-8') as f:
    f.write(new_quiz_content)

# Now fix App.jsx by removing the broken lines (including the final )})
new_app_content = "".join(app_lines[:start_idx] + app_lines[end_idx+1:])

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_app_content)

print("Fixed QuizTab and App.jsx successfully.")
