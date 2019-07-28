var browser = browser || chrome;
document.getElementById('cancelButton').addEventListener('click', () => {
    browser.runtime.sendMessage({ acceptClicked: false, closeCallingTab: true }, () => { });
});
document.getElementById('acceptButton').addEventListener('click', () => {
    browser.runtime.sendMessage({ acceptClicked: true, closeCallingTab: true }, () => { });
});
