# Custom GPT User Guide

Welcome to the Custom GPT feature! This guide will help you create and use personalized AI assistants tailored to your specific needs.

---

## Table of Contents

1. [What are Custom GPTs?](#what-are-custom-gpts)
2. [Getting Started](#getting-started)
3. [Creating a Custom GPT](#creating-a-custom-gpt)
4. [Managing Custom GPTs](#managing-custom-gpts)
5. [Using Custom GPTs](#using-custom-gpts)
6. [Knowledge Base](#knowledge-base)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## What are Custom GPTs?

Custom GPTs are personalized AI assistants that you can create with:

- **Custom Instructions**: Define how the AI should behave and respond
- **Knowledge Base**: Upload documents that the AI can reference
- **Custom Settings**: Choose specific models and configure parameters
- **Conversation Starters**: Provide example prompts to help users get started

Think of Custom GPTs as specialized versions of the AI, each trained for a specific purpose or domain.

---

## Getting Started

### Accessing Custom GPTs

1. Navigate to the **Custom GPTs** page from the main menu
2. Click **"Create Custom GPT"** to build your first assistant
3. Or browse existing Custom GPTs to see what's available

### Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for syncing with the server
- (Optional) Documents to upload as knowledge base

---

## Creating a Custom GPT

### Step 1: Basic Information

1. **Name**: Give your Custom GPT a descriptive name
   - Example: "Research Assistant", "Code Helper", "Writing Coach"
   - Keep it short and memorable (max 100 characters)

2. **Description**: Briefly describe what this GPT does
   - Example: "Helps with academic research and paper writing"
   - Max 500 characters

3. **Avatar** (Optional): Add an emoji to represent your GPT
   - Example: 🤖, 📚, 💡, 🎨

### Step 2: Instructions

This is the most important part! Write clear instructions that define:

- **Role**: What is the AI's role or persona?
- **Behavior**: How should it respond to users?
- **Constraints**: What should it avoid or prioritize?
- **Format**: How should it structure responses?

**Example Instructions:**

```
You are an expert research assistant specializing in academic papers.

Your role is to:
1. Help users find relevant research papers and sources
2. Summarize complex academic content in clear language
3. Suggest research directions and methodologies
4. Cite sources properly in APA format

Guidelines:
- Always provide citations for factual claims
- Ask clarifying questions when the research topic is unclear
- Suggest multiple perspectives on controversial topics
- Be thorough but concise in your explanations

When responding:
- Start with a brief summary
- Provide detailed analysis in bullet points
- End with suggested next steps or further reading
```

**Tips:**
- Be specific and detailed (10-10,000 characters)
- Use examples to illustrate expected behavior
- Test and refine based on actual usage

### Step 3: Conversation Starters

Add 3-5 example prompts that demonstrate what users can ask:

- "Help me research climate change impacts"
- "Summarize this research paper"
- "Find sources on machine learning ethics"
- "Suggest a research methodology for my thesis"

These appear as quick-start buttons for users.

### Step 4: Model Settings

**Recommended Model** (Optional):
- Choose a specific LLM provider and model
- Different models have different strengths:
  - **o3-mini**: Best for reasoning tasks
  - **gpt-4o**: Most capable, good for complex tasks
  - **gpt-4o-mini**: Fast and affordable
  - **DeepSeek R1**: Excellent reasoning

**Temperature** (0-2):
- **Low (0-0.5)**: More focused and deterministic
- **Medium (0.5-1.0)**: Balanced creativity and consistency
- **High (1.0-2.0)**: More creative and varied responses

### Step 5: Capabilities

Enable features for your Custom GPT:

- ✅ **Web Search**: Allow the AI to search the web using Firecrawl
- ✅ **File Analysis**: Allow users to upload files during conversations
- ⬜ **Image Generation**: (Coming soon) Generate images with DALL-E
- ⬜ **Code Interpreter**: (Coming soon) Execute code

### Step 6: Save

Click **"Create Custom GPT"** to save your configuration.

---

## Managing Custom GPTs

### Viewing Custom GPTs

The Custom GPTs page shows all your assistants with:
- Name and description
- Number of knowledge files
- Enabled capabilities
- Recommended model

### Editing a Custom GPT

1. Click the **⋮** menu on a Custom GPT card
2. Select **"Edit"**
3. Make your changes
4. Click **"Save Changes"**

### Duplicating a Custom GPT

1. Click the **⋮** menu on a Custom GPT card
2. Select **"Duplicate"**
3. A copy will be created with "(Copy)" appended to the name
4. Edit the duplicate as needed

**Note**: Knowledge files are NOT copied when duplicating.

### Deleting a Custom GPT

1. Click the **⋮** menu on a Custom GPT card
2. Select **"Delete"**
3. Confirm the deletion

**Warning**: This action cannot be undone. All knowledge files will also be deleted.

---

## Using Custom GPTs

### Selecting a Custom GPT

**In Chat Mode:**
1. Click the Custom GPT selector in the chat interface
2. Choose your desired Custom GPT
3. Start chatting!

**In Research Mode:**
1. Click the Custom GPT selector in the research interface
2. Choose your desired Custom GPT
3. Enter your research query

### Active Custom GPT Indicator

When a Custom GPT is active, you'll see:
- The Custom GPT name and avatar in the interface
- Custom conversation starters (if configured)
- Any special capabilities enabled

### Switching Custom GPTs

You can switch between Custom GPTs at any time:
1. Click the Custom GPT selector
2. Choose a different Custom GPT
3. The new instructions will apply to future messages

**Note**: Previous messages in the conversation retain their original context.

### Disabling Custom GPT

To use the default AI without custom instructions:
1. Click the Custom GPT selector
2. Select **"None"** or **"Default"**

---

## Knowledge Base

### Uploading Knowledge Files

1. Edit your Custom GPT
2. Scroll to the **"Knowledge"** section
3. Click **"Upload File"** or drag and drop
4. Wait for processing to complete

**Supported File Types:**
- PDF (.pdf)
- Text (.txt)
- Markdown (.md)
- Word Documents (.doc, .docx)

**Limits:**
- Max file size: 10 MB per file
- Max total knowledge: 50 MB per Custom GPT
- Max files: No hard limit, but performance may degrade with many files

### How Knowledge Base Works

When you send a message:
1. The system extracts relevant context from your knowledge files
2. This context is added to the AI's prompt
3. The AI uses this information to answer your questions

**Important**: The AI will only use information from the knowledge base. If the answer isn't in the uploaded documents, it will say so.

### Managing Knowledge Files

**View Files:**
- See all uploaded files in the Custom GPT edit page
- Check processing status (pending, processing, completed, error)

**Delete Files:**
1. Click the **🗑️** icon next to a file
2. Confirm deletion

**Reprocess Files:**
If a file fails to process, you can:
1. Delete the failed file
2. Re-upload it

### Best Practices for Knowledge Files

1. **Use clear, well-formatted documents**
   - PDFs with selectable text (not scanned images)
   - Properly structured Word documents
   - Clean markdown files

2. **Organize information logically**
   - Use headings and sections
   - Include table of contents for long documents
   - Break very large documents into smaller files

3. **Keep files focused**
   - Upload documents relevant to the Custom GPT's purpose
   - Remove unnecessary content
   - Update files when information changes

4. **Test and iterate**
   - Ask questions to verify the AI can find information
   - Refine documents based on what works
   - Remove files that aren't being used

---

## Best Practices

### Writing Effective Instructions

1. **Be Specific**: Vague instructions lead to unpredictable behavior
2. **Use Examples**: Show the AI what you want with concrete examples
3. **Set Boundaries**: Clearly state what the AI should and shouldn't do
4. **Iterate**: Test your Custom GPT and refine instructions based on results

### Choosing the Right Model

- **Complex reasoning**: o3-mini, DeepSeek R1
- **General purpose**: gpt-4o
- **Speed and cost**: gpt-4o-mini
- **Specialized tasks**: Check model documentation for strengths

### Organizing Custom GPTs

- Create separate Custom GPTs for different use cases
- Use clear, descriptive names
- Keep instructions focused on one purpose
- Don't try to make one Custom GPT do everything

### Testing Your Custom GPT

1. Use conversation starters to test basic functionality
2. Try edge cases and unusual queries
3. Verify knowledge base retrieval works correctly
4. Adjust temperature if responses are too random or too rigid

---

## Troubleshooting

### Custom GPT Not Responding as Expected

**Problem**: The AI doesn't follow your instructions

**Solutions**:
- Make instructions more specific and detailed
- Add examples of desired behavior
- Check if instructions contradict each other
- Try a different model (some are better at following instructions)

### Knowledge Base Not Working

**Problem**: The AI doesn't use uploaded documents

**Solutions**:
- Check file processing status (must be "completed")
- Verify file format is supported
- Ensure file contains selectable text (not scanned images)
- Try asking more specific questions that reference the documents
- Check file size limits

### File Upload Fails

**Problem**: Knowledge file won't upload

**Solutions**:
- Check file size (max 10 MB)
- Verify file type is supported
- Try converting to a different format (e.g., DOCX to PDF)
- Check internet connection
- Try uploading a smaller file first

### Custom GPT Deleted Accidentally

**Problem**: Deleted a Custom GPT by mistake

**Solutions**:
- Unfortunately, deletions cannot be undone
- Recreate the Custom GPT from scratch
- If you exported the configuration, import it back
- Consider duplicating important Custom GPTs as backups

### Performance Issues

**Problem**: Responses are slow or timing out

**Solutions**:
- Reduce knowledge base size (remove unnecessary files)
- Use a faster model (e.g., gpt-4o-mini)
- Simplify instructions
- Check internet connection
- Try again during off-peak hours

---

## Advanced Features (Coming Soon)

- **Vector Embeddings**: Semantic search for better knowledge retrieval
- **Multi-user Sharing**: Share Custom GPTs with team members
- **Custom GPT Marketplace**: Discover and use community-created GPTs
- **Version Control**: Track changes to Custom GPT configurations
- **Analytics**: See usage statistics and performance metrics
- **Import/Export**: Backup and share Custom GPT configurations

---

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/AppleLamps/deep-research/issues)
2. Review the [Design Document](./CUSTOM_GPT_DESIGN.md) for technical details
3. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)

---

## Feedback

We'd love to hear your feedback on the Custom GPT feature!

- What works well?
- What could be improved?
- What features would you like to see?

Share your thoughts by creating a GitHub issue or discussion.

---

**Happy building! 🚀**

