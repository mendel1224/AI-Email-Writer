// Watch for url change to compose, then inject button

console.log("Email Writer Extension - Content Script Loaded"); 

function createAIButton(){
  const button = document.createElement('div');
  button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
  button.style.marginRight = '8px';
  button.innerHTML = 'AI Reply';
  button.setAttribute('role', 'button');
  button.setAttribute('data-tooltip', 'Generate AI Reply');
  return button;
}

function getEmailContent() {
    const selectors = [
      '.h7',
      '.a3s.aiL',
      '.gmail_quote',
      '[role="presentation"]'
    ];
    for (const selector of selectors) {
      const content = document.querySelector(selector);
      if (content) {
        return content.innerText.trim();
      }
    }
    return ''; // ← this should only run if no content was found
  }
  

function findComposeToolbar() {
    const selectors = [
        '.btC',
        '.aDh',
        '[role = "toolbar"]',
        'gU.Up'
    ]
    for (const selector of selectors)
    {
        const toolbar = document.querySelector(selector);
    
        if (toolbar)
        {
        return toolbar;
        }
    return null;
    }
}

function injectButton()
{
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) {
        existingButton.remove();
        }
    const toolbar = findComposeToolbar();
    if (!toolbar){
        console.log("Toolbar not found");
        return;
    }
    console.log("Toolbar found. Creating AI button");
    const button = createAIButton();
    button.classList.add('ai-reply-button');

    button.addEventListener('click', async () => {
        try {
             button.innerHTML = 'Generating...';
             button.disabled = true;

             const emailContent = getEmailContent();
             const response = await fetch('http://localhost:8080/api/email/generate',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: "professional"
                })
             });

             if (!response.ok) {
                throw new Error('API Request Failed');
             }
             const generatedReply = await response.text();
             const composeBox = document.querySelector('[role = "textbox"][g_editable="true"]');
             if (composeBox){
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
             }
             else {
                console.error('Compose Box was not found');
             }

        } catch(error){
            console.log(error);
            alert('Failed to generate reply');
        }
        finally {
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        }
        
    });
    toolbar.insertBefore(button, toolbar.firstChild);

}

// Create a new MutationObserver instance with a callback function.
// This function will run whenever changes (mutations) are detected in the DOM.

const observer = new MutationObserver((mutations) => {

    // Loop through each mutation record provided by the observer.
    for (const mutation of mutations) {

        // Convert the list of added nodes to a real array so we can use array methods like .some()
        const addedNode = Array.from(mutation.addedNodes);

        // Check if any of the added nodes are elements and either:
        // 1. Directly match a selector for Gmail's compose window elements
        // 2. Contain (as children) elements that match those selectors
        const hasComposeElements = addedNode.some(node => 
            node.nodeType === Node.ELEMENT_NODE && ( // Make sure the node is an element (not text, etc.)
                node.matches('aDh, .btC, [role="dialog"]') ||         // Check if it matches directly
                node.querySelector('aDh, .btC, [role="dialog"]')      // Or if it contains a matching element
            )
        );
        if (hasComposeElements){
            console.log("Compose Window Detected");
            setTimeout(injectButton, 500);
        }
    }
});
// Observe the document body
observer.observe(document.body, {
    childList: true,
    subtree: true
});