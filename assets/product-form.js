if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();
      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      this.submitButton = this.querySelector('[type="submit"]');
      if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

      this.hideErrors = this.dataset.hideErrors === 'true';
      this.checkmarkTimeout = null;
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      // Clear any existing checkmark timeout
      if (this.checkmarkTimeout) {
        clearTimeout(this.checkmarkTimeout);
        this.checkmarkTimeout = null;
      }

      this.handleErrorMessage();

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');
      this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      const formData = new FormData(this.form);
      if (this.cart) {
        formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
        formData.append('sections_url', window.location.pathname);
        this.cart.setActiveElement(document.activeElement);
      }
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            publish(PUB_SUB_EVENTS.cartError, {source: 'product-form', productVariantId: formData.get('id'), errors: response.description, message: response.message});
            this.handleErrorMessage(response.description);

            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (!soldOutMessage) return;
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButton.querySelector('span').classList.add('hidden');
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          } else if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }

          if (!this.error) publish(PUB_SUB_EVENTS.cartUpdate, {source: 'product-form', productVariantId: formData.get('id')});
          this.error = false;
          
          // Show checkmark on successful add to cart
          this.showCheckmark();
          
          const quickAddModal = this.closest('quick-add-modal');
          const noDrawer = this.dataset.noDrawer === 'true';
          const isQuickAdd = this.dataset.quickAddModal === 'true';
          
          if (quickAddModal && isQuickAdd) {
            // Update cart sections without opening drawer
            if (this.cart && this.cart.tagName === 'CART-DRAWER') {
              const drawerInner = this.cart.querySelector('.drawer__inner');
              if (drawerInner && drawerInner.classList.contains('is-empty')) {
                drawerInner.classList.remove('is-empty');
              }
              this.cart.productId = response.id;
              this.cart.getSectionsToRender().forEach((section) => {
                if (response.sections && response.sections[section.id]) {
                  const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
                  if (sectionElement) {
                    sectionElement.innerHTML = this.cart.getSectionInnerHTML(response.sections[section.id], section.selector);
                  }
                }
              });
              if (this.cart.classList.contains('is-empty')) {
                this.cart.classList.remove('is-empty');
              }
            }
            // Update the "Optionen wählen" button text
            this.updateChooseOptionsButton(quickAddModal);
            // Close the modal
            quickAddModal.hide(true);
          } else if (quickAddModal) {
            document.body.addEventListener('modalClosed', () => {
              setTimeout(() => { this.cart.renderContents(response) });
            }, { once: true });
            quickAddModal.hide(true);
          } else if (noDrawer && this.cart && this.cart.tagName === 'CART-DRAWER') {
            // Update cart sections without opening drawer
            const drawerInner = this.cart.querySelector('.drawer__inner');
            if (drawerInner && drawerInner.classList.contains('is-empty')) {
              drawerInner.classList.remove('is-empty');
            }
            this.cart.productId = response.id;
            this.cart.getSectionsToRender().forEach((section) => {
              if (response.sections && response.sections[section.id]) {
                const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
                if (sectionElement) {
                  sectionElement.innerHTML = this.cart.getSectionInnerHTML(response.sections[section.id], section.selector);
                }
              }
            });
            // Re-attach overlay click handler without opening drawer
            setTimeout(() => {
              this.cart.querySelector('#CartDrawer-Overlay')?.addEventListener('click', this.cart.close.bind(this.cart));
            });
            if (this.cart.classList.contains('is-empty')) {
              this.cart.classList.remove('is-empty');
            }
          } else {
            this.cart.renderContents(response);
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading-overlay__spinner').classList.add('hidden');
          
          // Reset button state on error (show plus icon again)
          if (this.error) {
            this.resetButtonState();
          }
        });
    }

    showCheckmark() {
      // Show checkmark
      this.submitButton.classList.add('added');
      const plusIcon = this.submitButton.querySelector('.button-icon--plus');
      const checkmarkIcon = this.submitButton.querySelector('.button-icon--checkmark');
      if (plusIcon) plusIcon.classList.add('hidden');
      if (checkmarkIcon) checkmarkIcon.classList.remove('hidden');
      
      // Hide checkmark after 2.5 seconds
      this.checkmarkTimeout = setTimeout(() => {
        this.resetButtonState();
        this.checkmarkTimeout = null;
      }, 2500);
    }

    resetButtonState() {
      // Clear timeout if it exists
      if (this.checkmarkTimeout) {
        clearTimeout(this.checkmarkTimeout);
        this.checkmarkTimeout = null;
      }
      
      // Reset to plus icon
      this.submitButton.classList.remove('added');
      const plusIcon = this.submitButton.querySelector('.button-icon--plus');
      const checkmarkIcon = this.submitButton.querySelector('.button-icon--checkmark');
      if (plusIcon) plusIcon.classList.remove('hidden');
      if (checkmarkIcon) checkmarkIcon.classList.add('hidden');
    }

    updateChooseOptionsButton(quickAddModal) {
      if (!quickAddModal || !quickAddModal.openedBy) return;
      
      const button = quickAddModal.openedBy;
      const buttonSpan = button.querySelector('span');
      if (!buttonSpan) return;
      
      // Store original text if not already stored
      if (!button.dataset.originalText) {
        button.dataset.originalText = buttonSpan.textContent.trim();
      }
      
      // Update button text to "Added to cart" (German: "Zum Warenkorb hinzugefügt")
      const addedText = button.dataset.addedText || '<svg class="icon icon-checkmark" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3.5L2.83333 4.75L4.16667 6L9.5 1" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
      buttonSpan.innerHTML = addedText;
      button.classList.add('added-to-cart');
      
      // Revert after 2.5 seconds
      if (button.chooseOptionsTimeout) {
        clearTimeout(button.chooseOptionsTimeout);
      }
      
      button.chooseOptionsTimeout = setTimeout(() => {
        if (button.dataset.originalText) {
          buttonSpan.textContent = button.dataset.originalText;
        }
        button.classList.remove('added-to-cart');
        button.chooseOptionsTimeout = null;
      }, 2500);
    }

    handleErrorMessage(errorMessage = false) {
      if (this.hideErrors) return;

      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}
