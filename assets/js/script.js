document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('notification-close-btn');
    if (!closeBtn) return;

    const panel = document.querySelector('.notification-panel');
    const wrapper = panel?.closest('[aria-live]');

    closeBtn.addEventListener('click', () => {
        if (!panel || !wrapper) return;
        panel.classList.add('is-closing');
        setTimeout(() => wrapper.remove(), 250);
    });
});
