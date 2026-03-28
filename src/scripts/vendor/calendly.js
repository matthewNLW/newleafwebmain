document.addEventListener("DOMContentLoaded", () => {
    const calendlyButton = document.getElementById("calendly-button");
    if (calendlyButton) {
        calendlyButton.addEventListener("click", (e) => {
            e.preventDefault();
            if (window.Calendly) {
                window.Calendly.initPopupWidget({ url: 'https://calendly.com/matthew-newleafweb/30min' });
            }
        });
    }
});
