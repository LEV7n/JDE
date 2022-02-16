import Helper from "./helper.js";

/**
 * Create and manage windows
 * Developed By Michael Levinez
 *
 * @class Window
 */
export default class Window {
    /*Class defaults*/
    #winMaxID = 0;
    windows = {};
    parent;
    movRes; // Movable/resizable flag to prevent rebinding to doc

    /**
     * Initialize
     *
     * @param {Object} [data]
     * @param {HTMLElement} [data.parent]
     * @return Window
     */
    constructor(data) {
        if (data?.parent) {
            this.area = document.createElement('div');
            this.area.classList.add('window-area');

            this.parent = data.parent;
            this.parent.append(this.area);
        }
    }

    /**
     * Create window
     *
     * @param {Object} data
     * @param {String} [data.icon] - window icon
     * @param {String} [data.title] - window title
     * @param {String} [data.parent] - attach window to parent or body
     * @param {Object} [data.css] - any css props { left: 0 }
     * @param {Boolean} [data.above] - determine that window will be above others { above: true }
     * @param {Array} [data.buttons] - [ 'minimize', 'toggle', 'close' ]
     * @param {Object} [data.events] - window callbacks
     * @param {Function} [data.events.onFocus]
     * @param {Function} [data.events.onBlur]
     * @param {Function} [data.events.onAbove]
     * @param {Function} [data.events.onBelow]
     * @param {Function} [data.events.onMoveStart]
     * @param {Function} [data.events.onMove]
     * @param {Function} [data.events.onMoveEnd]
     * @param {Function} [data.events.onResize]
     * @param {Function} [data.events.onMinimize]
     * @param {Function} [data.events.onMaximize]
     * @param {Function} [data.events.onToggle]
     * @param {Function} [data.events.onClose]
     * @param {HTMLElement, DocumentFragment} data.content - content that will be attached to window
     *
     * @return Object
     */
    createWindow(data) {
        const
            id = ++this.#winMaxID,
            window = document.createElement('div'),
            heading = document.createElement('div'),
            name = document.createElement('span'),
            content = document.createElement('div'),
            icon = desktop.renderIcon(data);

        window.id = id.toString();
        window.classList.add('window');
        window.style
            .setProperty('--top', `${ id * 10 }px`);
        window.style
            .setProperty('--left', `${ id * 10 }px`);

        /*Set static styles*/
        if (data?.css) {
            Object.keys(data.css)
                .forEach((key) => {
                    window.style
                        .setProperty(key, `${ data.css[key] }${ typeof data.css[key] === 'number' ? 'px' : '' }`);
                });
        }

        heading.append(icon);

        name.classList.add('name');
        name.innerText = data?.title || 'Unknown';
        heading.append(name);

        heading.classList.add('title', 'no-select');

        content.classList.add('content');
        content.append(data?.content);

        window.append(heading);
        window.append(content);
        (data?.parent || document.body).append(window);

        this.windows[id] = {
            id: id,
            window: window,
            above: data?.above,
            heading: heading,
            title: (value) => !value ? name.innerText : name.innerText = value,
            events: {
                onFocus: data?.events?.onFocus || new Function(),
                onBlur: data?.events?.onBlur || new Function(),
                onAbove: data?.events?.onAbove || new Function(),
                onBelow: data?.events?.onBelow || new Function(),
                onMoveStart: data?.events?.onMove || new Function(),
                onMove: data?.events?.onMove || new Function(),
                onMoveEnd: data?.events?.onMove || new Function(),
                onResize: data?.events?.onResize || new Function(),
                onMaximize: data?.events?.onMaximize || new Function(),
                onMinimize: data?.events?.onMinimize || new Function(),
                onToggle: data?.events?.onToggle || new Function(),
                onClose: data?.events?.onClose || new Function(),
            },
            controls: this.#createWindowControls({
                id: id,
                window: window,
                heading: heading,
                buttons: Object.assign([], [ 'minimize', 'toggle', 'close' ], data?.buttons || [])
            }),
            content: content
        };

        /*Make window above others on demand*/
        if (data?.above)
            this.#windowAbove(id);

        /*Focus on single click*/
        Helper.delegate('click', '.window', (e, target) => {
            Object.keys(this.windows).forEach((id) =>
                this.#blurWindow(id, e));
            this.#focusWindow(target.id, e);
        });

        /*Maximize/Minimize on double click*/
        Helper.delegate('dblclick', '.window > .title', (e, target) => {
            this.#toggle(target.parentNode.id, e);
        });

        /*Focus last created window*/
        Object.keys(this.windows).forEach((id) =>
            this.#blurWindow(id));
        this.#focusWindow(id);

        /*Add move/resize handlers*/
        this.#bindWindowMoveResize(id);

        return this.windows[id];
    }

    /**
     * Create window controls
     *
     * @param {Object} data
     * @param {Number} data.id
     * @param {HTMLDivElement} data.window
     * @param {HTMLDivElement} data.heading
     * @param {Object} data.buttons
     *
     * @return Object
     */
    #createWindowControls(data) {
        const
            { id, heading } = data,
            buttons = document.createElement('div');
            buttons.classList.add('buttons-holder');

        data.buttons.forEach((type) => {
            const
                button = document.createElement('button');

            desktop.applyClasses({
                default: `btn-${ type }`,
                classes: (() => {
                    switch (type) {
                        case 'minimize': return 'minimize';
                        case 'toggle': return 'maximize';
                        case 'close': return 'close';
                    }
                })()
            }, button);

            button.addEventListener('click', (e) => {
                e.preventDefault();

                switch (type) {
                    case 'minimize': return this.#minimize(id, e);
                    case 'toggle': return this.#toggle(id, e);
                    case 'close': return this.#destroyWindow(id, e);
                }
            }, false);

            buttons.append(button);
        });

        heading.append(buttons);

        return {
            holder: buttons,
            buttons: buttons.querySelectorAll('button')
        }
    }

    /**
     * Focus window by ID
     *
     * @param {Number, String} id
     * @param {Event} [e]
     */
    #focusWindow(id, e) {
        if (this.windows[id] && !this.windows[id].above)
            this.windows[id].window.classList.add('focus-in');
            this.#callEvent('onFocus', id, e);
    }

    /**
     * Blur window by ID
     *
     * @param {Number, String} id
     * @param {Event} [e]
     */
    #blurWindow(id, e) {
        if (this.windows[id] && !this.windows[id].above)
            this.windows[id].window.classList.remove('focus-in');
            this.#callEvent('onBlur', id, e);
    }

    /**
     * Make window above others ID
     *
     * @param {Number, String} id
     * @param {Event} [e]
     */
    #windowAbove(id, e) {
        if (this.windows[id])
            this.windows[id].window.classList.add('above');
            this.windows[id].above = true;
            this.#callEvent('onAbove', id, e);
    }

    /**
     * Make window below others ID
     *
     * @param {Number, String} id
     * @param {Event} [e]
     */
    #windowBelow(id, e) {
        if (this.windows[id])
            this.windows[id].window.classList.remove('above');
            this.windows[id].above = false;
            this.#callEvent('onBelow', id, e);
    }

    /**
     * Destroy window by ID
     *
     * @param {Number, String} id
     * @param {Event} [e]
     */
    #destroyWindow(id, e) {
        if (this.windows[id]) {
            this.windows[id].window.remove();
            this.#callEvent('onClose', id, e);
            delete this.windows[id];
        }
    }

    /**
     * Minimize window
     *
     * @param {Number, String} id
     * @param {Event} [e]
     */
    #minimize(id, e) {
        const
            data = this.windows[id.toString()];

        if (!data) return;

        if (!data.window.classList.contains('minimized'))
            data.window.classList.add('minimized');
            this.#callEvent('onMinimize', data.window.id, e);
    }

    /**
     * Normalize/Maximize window
     *
     * @param {Number, String} id
     * @param {Event} [e]
     */
    #toggle(id, e) {
        const
            data = this.windows[id.toString()];

        if (!data) return;

        if (!data.window.classList.contains('minimized')) {
            data.window.classList.toggle('maximized');
            data.window.classList.remove('minimized');
            ([...data.controls.buttons]
                .filter(f => f.matches('.btn-toggle'))[0] || {})
                    .classList
                        .replace(
                            data.window.classList.contains('maximized') ? 'maximize' : 'restore',
                            data.window.classList.contains('maximized') ? 'restore' : 'maximize',
                        );
            this.#callEvent('onMaximize', data.window.id, e);
        } else
            data.window.classList.remove('minimized');
            this.#callEvent('onMinimize', data.window.id, e);

        this.#callEvent('onToggle', data.window.id, e);
    }

    /**
     * Make windows movable/resizable
     *
     * @param {Number, String} id
     */
    #bindWindowMoveResize(id) {
        this.windows[id].resizer = {
            'resize-t': document.createElement('span'),
            'resize-r': document.createElement('span'),
            'resize-b': document.createElement('span'),
            'resize-l': document.createElement('span'),
            'resize-t-l': document.createElement('span'),
            'resize-t-r': document.createElement('span'),
            'resize-b-r': document.createElement('span'),
            'resize-b-l': document.createElement('span')
        }

        const
            resizer = document.createElement('span');
            resizer.classList.add('resizer');
            Object.keys(this.windows[id].resizer).forEach(key => {
                this.windows[id].resizer[key].classList.add(key);
                resizer.append(this.windows[id].resizer[key]);
                this.windows[id].resizer[key].addEventListener('mousedown', (e) => {
                    this.#windowMouseDownAction(id, e);
                });
            });
            this.windows[id].window.append(resizer);

        this.windows[id].heading.addEventListener('mousedown', (e) => {
            this.#headMouseDownAction(id, e, this.windows[id].heading);
        });

        /*Prevent multiple bind to document*/
        if (this.movRes)
            return;

        document.addEventListener('mousemove', (e) => {
            if (!this.dragging)
                return;

            /*Move window start*/
            if (this.dragItem.matches('.title'))
                this.#windowMoveStartAction(e);
            else if (this.dragItem.matches('span[class*="resize"]'))
                this.#windowResizeStartAction(e);
        });

        document.addEventListener('mouseup', (e) => {
            if (!this.dragging)
                return;

            /*Move window end*/
            if (this.dragItem.matches('.title'))
                this.#windowMoveEndAction(e);
            else if (this.dragItem.matches('span[class*="resize"]'))
                this.#windowResizeEndAction(e);
        });
    }

    /**
     * Move handler for heading
     *
     * @param {Number, String} id
     * @param {MouseEvent} e
     * @param {HTMLElement} [target]
     */
    #headMouseDownAction(id, e, target) {
        if (e.button || (target || e.target).matches('button[class*="btn-"]'))
            return;

        this.#windowMouseDownAction(id, e, target || e.target);

        this.#callEvent('onMoveStart', id, e);
    }

    /**
     * Mousedown handler for item
     *
     * @param {Number, String} id
     * @param {MouseEvent} e
     * @param {HTMLElement} [target]
     */
    #windowMouseDownAction(id, e, target) {
        this.dragging = this.windows[id];
        this.dragItem = target || e.target;
        this.objInitLeft = this.dragging.window.offsetLeft;
        this.objInitTop = this.dragging.window.offsetTop;
        this.dragStartX = e.pageX;
        this.dragStartY = e.pageY;
    }

    /**
     * Mouseup handler for document
     */
    #windowMouseUpAction() {
        delete this.dragging;
        delete this.dragItem;
        delete this.objInitLeft;
        delete this.objInitTop;
        delete this.dragStartX;
        delete this.dragStartY;
    }

    /**
     * Move start handler for document
     *
     * @param {MouseEvent} e
     */
    #windowMoveStartAction(e) {
        if (this.dragging.window.classList.contains('maximized'))
            this.#toggle(this.dragging.id);

        const
            boundary = this.dragging.window.getBoundingClientRect(),
            x = this.objInitLeft + e.pageX - this.dragStartX,
            y = this.objInitTop + e.pageY - this.dragStartY;

        this.dragging.window.style.inset = '';

        if (!this.dragging.window.style.height)
            this.dragging.window.style.height = `${ boundary.height.toFixed(2) }px`;

        if (!this.dragging.window.style.width)
            this.dragging.window.style.width = `${ boundary.width.toFixed(2) }px`;

        this.dragging.window.style.setProperty('--top', `${ y > 0 ? y : 0 }px`);
        this.dragging.window.style.setProperty('--left', `${ x }px`);
        this.dragging.window.className = this.dragging.window.className.replace(/[xy]-.\s?/g, '');
        this.dragging.window.classList.add('move');

        this.#callEvent('onMove', this.dragging.id, e);
        this.#drawWindowAreas(e);
    }

    /**
     * Move end handler for document
     *
     * @param {MouseEvent} e
     */
    #windowMoveEndAction(e) {
        this.dragging.window.classList.remove('move');
        this.#drawWindowAreas(e);

        this.#callEvent('onMoveEnd', this.dragging.id, e);

        this.#windowMouseUpAction();
    }

    /**
     * Resize start handler for document
     *
     * @param {MouseEvent} e
     */
    #windowResizeStartAction(e) {
        const
            boundary = this.dragging.window.getBoundingClientRect(),
            computed = window.getComputedStyle(this.dragging.window, null),
            x = this.objInitLeft + e.pageX - this.dragStartX,
            y = this.objInitTop + e.pageY - this.dragStartY;

        this.parent.style.cursor = window.getComputedStyle(this.dragItem, null)?.cursor;

        this.parent.classList.add('no-select');
        this.dragging.window.classList.add('resize');
        this.dragging.window.style
            .setProperty('--top', `${ computed?.top || 'auto' }`);
        this.dragging.window.style
            .setProperty('--left', `${ computed?.left || 'auto' }`);
        this.dragging.window.style.inset = '';

        switch (this.dragItem.classList[0]) {
            case 'resize-t': {
                this.dragging.window.style
                    .setProperty('--top', `${ y }px`);
                this.dragging.window.style
                    .setProperty('--bottom', `${ this.parent.offsetHeight - boundary.height }px`);
                this.dragging.window.style.height = '';
                break;
            }

            case 'resize-r': {
                console.log(boundary.right - x)
                this.dragging.window.style
                    .setProperty('--left', `${ boundary.left }px`);
                this.dragging.window.style
                    .setProperty('--right', `${ boundary.right - x }px`);
                this.dragging.window.style.width = '';
                break;
            }

            case 'resize-l': {
                this.dragging.window.style
                    .setProperty('--left', `${ x }px`);
                this.dragging.window.style
                    .setProperty('--right', `${ this.parent.offsetWidth - boundary.right }px`);
                this.dragging.window.style.width = '';
                break;
            }
        }
    }

    /**
     * Resize end handler for document
     *
     * @param {MouseEvent} e
     */
    #windowResizeEndAction(e) {
        this.parent.style.cursor = '';
        this.parent.classList.remove('no-select');
        this.dragging.window.classList.remove('resize');
        this.#windowMouseUpAction();
    }

    /**
     * Draw window areas at corners to drop
     *
     * @param {MouseEvent} e
     */
    #drawWindowAreas(e) {
        if (!this.area)
            return;

        const
            boundary = desktop.holder.getBoundingClientRect(),
            height = boundary.height / 3;

        if (e.type === 'mousemove') {
            this.#resetWindowAreas();

            /*Draw by x-axis*/
            if (e.pageX <= 50)
                this.area.classList.add('x-l');
            else if (e.pageX >= boundary.width - 50)
                this.area.classList.add('x-r');

            /*Draw by y-axis*/
            if (this.area.className.includes('x-')) {
                if (e.pageY <= height)
                    this.area.classList.add('y-t');
                else if (e.pageY <= height * 2)
                    this.area.classList.add('y-m');
                else if (e.pageY <= height * 3)
                    this.area.classList.add('y-b');
            }
        } else {
            if (this.area.className.includes('x-') && this.area.className.includes('y-')) {
                [...this.area.classList].slice(1).forEach(c =>
                    this.windows[this.dragging.id].window.classList.add(c));

                this.#callEvent('onResize', this.dragging.id, e);
            }

            this.#resetWindowAreas();
        }
    }

    /**
     * Reset window areas
     */
    #resetWindowAreas() {
        [...this.area.classList]
            .slice(1)
            .forEach(c => this.area.classList.remove(c));
    }

    /**
     * Call window event callback
     *
     * @param {String} event
     * @param {Number, String} id
     * @param {Event} [e]
     */
    #callEvent(event, id, e) {
        const
            data = this.windows[id.toString()];

        if (!data) return;

        if (data?.events && Helper.isFunc(data?.events[event]))
            data.events[event].call(this, data, e);
    }
}

/*Import needed styles*/
Helper.importStyle([ 'css/window.css' ]);