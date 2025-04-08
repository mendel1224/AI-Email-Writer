// Watch for Gmail compose window and inject the AI button
console.log("Email Writer Extension - Content Script Loaded");

// Function to create the AI Reply button
function createAIButton() {
  const button = document.createElement('div');
  // Use Gmail's native button class for consistent styling
  button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
  button.style.marginRight = '8px';
  button.innerHTML = 'AI Reply';
  button.setAttribute('role', 'button');
  button.setAttribute('data-tooltip', 'Generate AI Reply'); // Tooltip on hover
  return button;
}

// Function to extract the email body content from the Gmail compose window
function getEmailContent() {
  const selectors = [
    '.h7',                // Header or subject line
    '.a3s.aiL',           // Gmail message body
    '.gmail_quote',       // Quoted reply content
    '[role="presentation"]' // Fallback Gmail wrapper
  ];

  // Try each selector until one returns content
  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) {
      return content.innerText.trim();
    }
  }

  // Return empty string if no content is found
  return '';
}

// Function to find the Gmail toolbar within the compose window
function findComposeToolbar() {
  const selectors = [
    '.btC',               // Primary Gmail compose toolbar
    '.aDh',               // Alternate class for toolbar
    '[role="toolbar"]',   // Semantic role-based selector
    'gU.Up'               // Additional fallback class
  ];

  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) {
      return toolbar;
    }
  }

  return null; // No toolbar found
}

// Function to inject the AI Reply button into the Gmail compose toolbar
function injectButton() {
  const existingButton = document.querySelector('.ai-reply-button');

  // Prevent multiple buttons from being injected
  if (existingButton) {
    existingButton.remove();
  }

  const toolbar = findComposeToolbar();

  if (!toolbar) {
    console.log("Toolbar not found");
    return;
  }

  console.log("Toolbar found. Creating AI button");

  const button = createAIButton();
  button.classList.add('ai-reply-button'); // Custom class for tracking

  // Add click event to generate the AI reply
  button.addEventListener('click', async () => {
    try {
      button.innerHTML = 'Generating...'; // Visual feedback
      button.disabled = true;

      const emailContent = getEmailContent();

      // Send email content to the Spring Boot backend
      const response = await fetch('http://localhost:8080/api/email/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailContent: emailContent,
          tone: "professional"
        })
      });

      // Handle API failure
      if (!response.ok) {
        throw new Error('API Request Failed');
      }

      const generatedReply = await response.text();

      // Insert generated text into Gmail's compose box
      const composeBox = document.querySelector('[role = "textbox"][g_editable="true"]');
      if (composeBox) {
        composeBox.focus();
        document.execCommand('insertText', false, generatedReply);
      } else {
        console.error('Compose Box was not found');
      }

    } catch (error) {
      console.log(error);
      alert('Failed to generate reply');
    } finally {
      // Reset button state
      button.innerHTML = 'AI Reply';
      button.disabled = false;
    }
  });

  // Insert the button as the first child of the toolbar
  toolbar.insertBefore(button, toolbar.firstChild);
}

// Create a MutationObserver instance that watches the DOM for changes
const observer = new MutationObserver((mutations) => {

  // Loop through each DOM mutation that was detected
  for (const mutation of mutations) {

    // Convert NodeList to an array for easier manipulation
    const addedNode = Array.from(mutation.addedNodes);

    // Check if any newly added nodes match or contain Gmail compose elements
    const hasComposeElements = addedNode.some(node =>
      node.nodeType === Node.ELEMENT_NODE && (
        node.matches('aDh, .btC, [role="dialog"]') || // Matches known compose window classes
        node.querySelector('aDh, .btC, [role="dialog"]') // Or contains one of those elements
      )
    );

    if (hasComposeElements) {
      console.log("Compose Window Detected");

      // Slight delay to ensure DOM is fully ready before injection
      setTimeout(injectButton, 500);
    }
  }
});

// Start observing the entire document body for child list changes (new elements)
observer.observe(document.body, {
  childList: true,
  subtree: true // Also watch nested elements
});
