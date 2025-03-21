document.addEventListener('DOMContentLoaded', function() {
    // Handle API key generation
    const generateKeyForm = document.getElementById('generate-key-form');
    if (generateKeyForm) {
        generateKeyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(generateKeyForm);
                const response = await fetch('/api/v1/keys/generate', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Show success message
                    showAlert('success', 'API key generated successfully');
                    // Refresh the page to show new key
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showAlert('error', data.error || 'Failed to generate API key');
                }
            } catch (error) {
                showAlert('error', 'An error occurred while generating the API key');
            }
        });
    }
    
    // Handle key revocation
    document.querySelectorAll('.revoke-key-btn').forEach(button => {
        button.addEventListener('click', async function() {
            if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
                return;
            }
            
            const keyId = this.dataset.keyId;
            
            try {
                const response = await fetch(`/api/v1/keys/${keyId}/revoke`, {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showAlert('success', 'API key revoked successfully');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showAlert('error', data.error || 'Failed to revoke API key');
                }
            } catch (error) {
                showAlert('error', 'An error occurred while revoking the API key');
            }
        });
    });
    
    // Handle key activation/deactivation
    document.querySelectorAll('.toggle-key-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const keyId = this.dataset.keyId;
            const action = this.dataset.active === 'true' ? 'deactivate' : 'activate';
            
            try {
                const response = await fetch(`/api/v1/keys/${keyId}/${action}`, {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showAlert('success', `API key ${action}d successfully`);
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showAlert('error', data.error || `Failed to ${action} API key`);
                }
            } catch (error) {
                showAlert('error', `An error occurred while ${action}ing the API key`);
            }
        });
    });
    
    // Copy API key to clipboard
    document.querySelectorAll('.copy-key-btn').forEach(button => {
        button.addEventListener('click', function() {
            const keyText = this.dataset.key;
            navigator.clipboard.writeText(keyText).then(() => {
                showAlert('success', 'API key copied to clipboard');
            }).catch(() => {
                showAlert('error', 'Failed to copy API key');
            });
        });
    });
});

// Helper function to show alerts
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
        alertContainer.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
} 