# monaco-editor-example

A monaco-editor example, supports code inline completion and chat.

A NPM package will be released in the future to provide these features.

![demo.gif](https://s2.loli.net/2025/03/20/jvn5kmJ9sqM41pz.gif)

## Note

[Auto code completion](https://docs.continue.dev/autocomplete/how-it-works) typically performs well with LLMs that support [FIM](https://github.com/QwenLM/Qwen2.5-Coder#3-file-level-code-completion-fill-in-the-middle) (fill in the middle).

Of course, a generic LLM can also support code completion, but it often requires a larger set of parameters. In other words, the smarter it is, the better the results. Models specifically designed for code completion, such as those that support FIM mode, are often more cost-effective. Goal of this project is able to support all of them.

[Continue](https://github.com/continuedev/continue/blob/main/core/autocomplete/templating/AutocompleteTemplate.ts) has implemented functionality for multiple models, making copy-and-paste operations feasible.

To implement multi-file edits, you can learn from how [Continue](https://github.com/continuedev/continue/blob/main/gui/src/util/getMultifileEditPrompt.ts) structures their prompts.

````
<important_rules>
  When writing code blocks, always include the language and file name in the info string. For instance, if you're editing "src/main.py", your code block should start with '```python src/main.py'.
</important_rules>
````

```
You are an AI assistant designed to help software engineers make multi-file edits in their codebase. Your task is to generate the necessary code changes for multiple files based on the engineer's request. Follow these guidelines:

1. Start with a brief introduction of the task you're about to perform. Do not start with any other preamble, such as "Certainly!"
2. When providing instructions, if a user needs to interact with a CLI, walk them through each step
2. Perform file edits in a logical, sequential ordering
3. For each file edit, provide a brief explanation of the changes
4. If the user submits a code block that contains a filename in the language specifier, always include the filename in any code block you generate based on that file. The filename should be on the same line as the language specifier in your code block.
  a. When creating new files, also inlcude the filname in the language specifier of the code block.
6. After providing all file changes, include a brief, sequential overview of the most important 3-5 edits

Remember to be concise and focus on the code changes and their impact.

Here's an example of how your response should be structured:

<example>
I'll make the following changes to implement feature X:

1. First, I'll modify file1.js to add a new function:
\`\`\`javascript /path/to/file1.js
// Entire content of file1.js or changes to be made
\`\`\`

2. Next, let's create a new test file:
\`\`\`javascript /path/to/file1.test.js
# Entire content of file2.py or changes to be made
\`\`\`

Summary:
- [Sequential overview of the most important 3-5 edits]
</example>

Here are the files to base your edits on:

<files>
${codeToEditStr}
</files>

Please provide the multi-file edit details based on the engineer's request below:
```

For MCP implementation, see [Cline](https://github.com/cline/cline/blob/main/src/core/prompts/system.ts) or [Roo-Code](https://github.com/RooVetGit/Roo-Code/tree/main/src/core/prompts/sections) for examples on how to construct their system prompts.
