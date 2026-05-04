const keyInput = document.getElementById('key');
const saveBtn = document.getElementById('save');
const msg = document.getElementById('msg');

chrome.runtime.sendMessage({ type: 'LOAD' }, (res) => {
  if (res?.key) keyInput.value = res.key;
});

saveBtn.addEventListener('click', () => {
  const key = keyInput.value.trim();
  chrome.runtime.sendMessage({ type: 'SAVE', key }, () => {
    msg.textContent = '✓ Saved!';
    setTimeout(() => msg.textContent = '', 2000);
  });
});
