(function() {
    // 建立共用的 CSSStyleSheet
    const sharedStyles = new CSSStyleSheet();
    sharedStyles.replaceSync(`
        .text-input-w-clr-btn {
            position: relative;
            display: inline-block;
            margin: 10px 0;
            input {
                padding: 8px 30px 8px 10px;
                font-size: 14px;
                border: 1px solid #ccc;
                border-radius: 4px;
                outline: none;
                min-width: 250px;
                &:focus { border-color: #4CAF50; }
                &:not(:placeholder-shown)~.clear-btn {
                    display: block;
                }
            }

            .clear-btn {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                cursor: pointer;
                color: #999;
                font-size: 18px;
                padding: 0;
                width: 20px;
                height: 20px;
                line-height: 20px;
                text-align: center;
                display: none;
                &:hover { color: #333;}
            }
        }             
        `);

    class CustomInput extends HTMLElement {
        // 宣告要監聽的屬性
        static get observedAttributes() {
            return ['value'];
        }

        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.adoptedStyleSheets = [sharedStyles];
        }
        // 元素插入 DOM 時觸發
        connectedCallback() {
            // 取得 placeholder 屬性值，若無則使用預設值
            const placeholder = this.getAttribute('placeholder') || 'Enter text...';
            const initialValue = this.getAttribute('value') || '';
            
            // 產生元件 HTML
            this.shadowRoot.innerHTML = `
                    <div class="text-input-w-clr-btn">
                        <input type="text" placeholder="${placeholder}" value="${initialValue}">
                        <button class="clear-btn" type="button">×</button>
                    </div>
                `;

            const input = this.shadowRoot.querySelector('input');
            const clearBtn = this.shadowRoot.querySelector('.clear-btn');

            clearBtn.addEventListener('click', () => {
                input.value = '';
                input.focus();
                this.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }

        // 元素從 DOM 移除時觸發
        disconnectedCallback() {

        }

        // 當屬性變更時同步更新 input 值
        attributeChangedCallback(name, oldValue, newValue) {
            if (name === 'value' && this.shadowRoot) {
                const input = this.shadowRoot.querySelector('input');
                if (input && input.value !== newValue) {
                    input.value = newValue || '';
                }
            }
        }

        // 提供 value 的 getter/setter 供 Vue3 使用
        get value() {
            return this.shadowRoot?.querySelector('input')?.value || '';
        }

        set value(val) {
            const input = this.shadowRoot?.querySelector('input');
            input && (input.value = val || '');
        }
    }

    customElements.define('input-with-clear-button', CustomInput);
})();