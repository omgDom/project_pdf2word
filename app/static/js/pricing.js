document.addEventListener('DOMContentLoaded', function() {
    const pricingToggle = document.getElementById('pricingToggle');
    const pricingCards = document.querySelectorAll('.pricing-card');
    const saveBadge = document.querySelector('.save-badge');
    const yearlyText = document.getElementById('yearlyText');
    const saveArrow = document.querySelector('.save-arrow');

    function updatePrices(isYearly) {
        pricingCards.forEach(card => {
            const monthlyPrice = parseFloat(card.dataset.monthly);
            const discountedMonthly = monthlyPrice * 0.8; // 20% discount
            const priceElement = card.querySelector('.price-amount');
            const periodElement = card.querySelector('.price-period');
            const savingsElement = card.querySelector('.yearly-savings');

            if (priceElement && monthlyPrice > 0) {
                if (isYearly) {
                    // Show discounted monthly price
                    priceElement.textContent = discountedMonthly.toFixed(2);
                    periodElement.textContent = '/month';
                    
                    // Calculate savings
                    const annualSaving = ((monthlyPrice * 12) - (discountedMonthly * 12)).toFixed(2);
                    if (savingsElement) {
                        savingsElement.innerHTML = `(Save $${annualSaving} with annual billing)`;
                        savingsElement.style.display = 'block';
                    }
                } else {
                    // Show regular monthly price
                    priceElement.textContent = monthlyPrice.toFixed(2);
                    periodElement.textContent = '/month';
                    if (savingsElement) {
                        savingsElement.style.display = 'none';
                    }
                }
            }
        });

        // Update save badge visibility
        if (saveBadge) {
            saveBadge.style.opacity = isYearly ? '1' : '0';
        }
    }

    function updateToggleState(isYearly) {
        if (isYearly) {
            yearlyText.classList.add('yearly-active');
            saveBadge.classList.add('show');
        } else {
            yearlyText.classList.remove('yearly-active');
            saveBadge.classList.remove('show');
        }
    }

    if (pricingToggle) {
        // Initial state
        updateToggleState(pricingToggle.checked);
        updatePrices(pricingToggle.checked);

        // Handle toggle changes
        pricingToggle.addEventListener('change', function() {
            updateToggleState(this.checked);
            updatePrices(this.checked);
        });
    }
}); 