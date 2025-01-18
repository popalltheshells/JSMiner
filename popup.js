document.getElementById("mineButton").addEventListener("click", async () => {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "Mining...";

  // Inject a content script to gather all .js file paths from the current page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const jsFiles = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Extract all <script> tags with .js file paths
      return Array.from(document.querySelectorAll('script[src]'))
        .map(script => script.src);
    }
  });

  const jsPaths = jsFiles[0].result;

  if (jsPaths.length === 0) {
    resultsDiv.innerHTML = "No .js files found.";
    return;
  }

  let output = "";
  for (const jsPath of jsPaths) {
    try {
      // Fetch the JS file content
      const response = await fetch(jsPath);
      const jsContent = await response.text();

      // Find all URLs or endpoints in the JS file
      const urls = jsContent.match(/https?:\/\/[^\s"'`<>]+/g);
      if (urls) {
        output += `<p><strong>${jsPath}</strong></p>`;
        output += `<ul>${urls.map(url => `<li>${url}</li>`).join("")}</ul>`;
      }
    } catch (error) {
      output += `<p><strong>Error fetching:</strong> ${jsPath}</p>`;
    }
  }

  resultsDiv.innerHTML = output || "No URLs or endpoints found.";
});
