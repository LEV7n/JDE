import Helper from "./helper.js";
import Window from './window.js';

/**
 * Create desktop environment
 * Developed By Michael Levinez
 *
 * @class Desktop
 */
export default class Desktop {
    #files = {};
    #paper = {};
    #theme = {};
    #items = {};
    #types = {};
    #assoc = {};
    #views = {};

    #splashscreen;

    /**
     * Initialize
     *
     * @param {Object} [data]
     *
     * @param {Object} [data.files] - filesystem structure
     *
     * #Wallpapers start#
     * @param {Object} [data.wallpapers]
     * @param {Array} [data.wallpapers.images]
     * @param {String} [data.wallpapers.images.url] - url to image
     * @param {Boolean} [data.wallpapers.images.active] - is active
     * @param {Object} [data.wallpapers.properties]
     * #Wallpapers end#
     *
     * #Themes start#
     * @param {Object} [data.themes]
     * @param {Object} [data.themes.current] - *Dynamic, contains current theme
     * @param {Array} [data.themes.fonts]
     * @param {String} [data.themes.fonts.name] - font name
     * @param {String} [data.themes.fonts.css] - font url
     * @param {String} [data.themes.fonts.alt] - alternative font-family, sans-serif or so
     * @param {String} [data.themes.fonts.size] - font-size/line-height
     * @param {String, Number} [data.themes.fonts.weight] - font-weight
     * @param {Boolean} [data.themes.fonts.active] - is active
     * @param {Array} [data.themes.icons]
     * @param {String} [data.themes.icons.name] - icon name
     * @param {String} [data.themes.icons.css] - icon url
     * @param {Boolean} [data.themes.icons.active] - is active
     * @param {Array} [data.themes.cursors]
     * @param {String} [data.themes.cursors.name] - cursor name
     * @param {Boolean} [data.themes.cursors.active] - is active
     * #Themes end#
     *
     * #Views start#
     * @param {Array} [data.views]
     * @param {String} [data.views.size] - icon size
     * @param {Boolean} [data.views.active] - is active
     * #Views end#
     *
     * @param {Object} [data.items] - Desktop items ~/home/$user/Desktop
     * @param {Object} [data.types] - Filetypes
     * @param {Object} [data.assoc] - File associations
     * @param {Array} [data.autorun] - Autorun apps
     * @return Desktop
     */
    constructor(data = {}) {
        this.#loadConfiguration({
            files: data?.items || '../../conf/filesystem.json',
            items: data?.items || '../../conf/desktop.json',
            types: data?.types || '../../conf/filetypes.json',
            assoc: data?.assoc || '../../conf/associations.json'
        })
            .then((config) => {
                this.#files = Object.assign({}, config[0] || {}, data?.files || {});
                this.#paper = Object.assign({}, config[1]?.wallpapers || {}, data?.wallpapers || {});
                this.#theme = Object.assign({}, config[1]?.themes || {}, data?.themes || {});
                this.#views = Object.assign([], config[1]?.views || [], data?.views || []);
                this.#items = Object.assign(
                {},
                this.resolveLocalPath(config[1]?.items)?.items || {},
                data?.items || {}
                );
                this.#types = Object.assign({}, config[2] || {}, data?.types || {});
                this.#assoc = Object.assign({}, config[3] || {}, data?.types || {});

                this.renderDesktop();

                /*Run autorun apps*/
                if (Array.isArray(data?.autorun))
                    this.autoRun(
                        ...data.autorun.map((app) => Object.assign({
                            parent: this.holder
                        }, this.#assoc[app?.name], app) || {})
                    );
            });
    }

    /**
     * Load desktop configuration
     *
     * @param {Object} data
     * @return Promise
     */
    #loadConfiguration(data) {
        return Promise.all(
            Object.keys(data)
                .filter(f => typeof f === 'string')
                .map((config) => {
                    return Helper.fetch({
                        url: data[config],
                        contentType: 'application/json'
                    });
                })
        );
    }

    /**
     * Get tree from path
     * @example this.resolveLocalPath('/root/')
     *
     * @param {String} path
     * @param {Object} [root]
     * @return {Object|null}
     */
    resolveLocalPath(path, root = this.#files) {
        if (typeof path !== 'string' || !path.length)
            return null;

        path = path
                .split('/')
                .filter(f => f)
                .map((p, i) => (i > 0 ? 'items.' : '') + p)
                .join('.');

        return new Function('fs', `return fs.${ path }`)(root);
    }

    /**
     * Get current theme
     *
     * @return {Object|number|{cursor: *, icon: *, font: *}|*}
     */
    getCurrentTheme() {
        return this.#theme.current;
    }

    /**
     * Get active set from collection
     *
     * @param set
     * @return {Object}
     */
    getActiveSet(set) {
        return (Array.isArray(set) ? set : []).filter(f => f?.active)[0] || {};
    }

    /**
     * Render taskbar
     *
     * @return {HTMLDivElement}
     */
    renderTaskbar() {
        const
            taskbar = document.createElement('div');
            taskbar.classList.add('taskbar');
            taskbar.innerText = 'There will be taskbar and widgets soon..';

        return taskbar;
    }

    /**
     * Render desktop
     */
    renderDesktop() {
        this.wrapper = document.createElement('div'),
        this.taskbar = this.renderTaskbar(),
        this.holder = document.createElement('div'),
        this.desktop = document.createElement('ul');

        /*Set wallpaper*/
        this.wrapper.classList.add('wrapper');
        this.wrapper.style.backgroundImage = `url("${ this.getActiveSet(this.#paper?.images)?.url }")`;

        /*Include theme css*/
        this.#theme.fonts.forEach(font => Helper.importStyle(font?.css));
        this.#theme.icons.forEach(icon => Helper.importStyle(icon?.css));
        this.#theme.current = (() => ({
            font: this.getActiveSet(this.#theme?.fonts),
            icon: this.getActiveSet(this.#theme?.icons),
            cursor: this.getActiveSet(this.#theme?.cursors),
        }))();

        /*Init desktop holder*/
        this.holder.classList.add('desktop-holder');
        this.holder.append(this.desktop);

        /*Render desktop items*/
        this.desktop.classList.add('desktop');
        this.desktop.style.setProperty('--size', this.getActiveSet(this.#views)?.size || '48px');
        this.desktop.innerHTML = '';
        this.desktop.append(this.renderItems());

        this.wrapper.append(this.taskbar);
        this.wrapper.append(this.holder);

        document.body.append(this.wrapper);

        /*Select on single click*/
        Helper.delegate('click', '.item', this.selectItems);

        /*Deselect on single click*/
        Helper.delegate('click', '.desktop-holder, .content', this.deselectItems);

        /*Open by double click*/
        Helper.delegate('dblclick', '.item', (e, target) => {
            const
                assoc = this.findAssocByType(target.data.type);

            if (assoc)
                target.data.assoc = assoc;

            this.openItem(
                Object.assign({ parent: this.holder }, target.data)
            );
        });

        /*Initialize window manager*/
        if (!this.jWM)
            this.jWM = new Window({ parent: this.holder });

        console.log(this)
    }

    /**
     * Render desktop items
     *
     * @param {Object} [items]
     * @return {DocumentFragment}
     */
    renderItems(items = this.#items) {
        const
            fragment = document.createDocumentFragment();

        Object.keys(items).forEach((fileName) => {
            const
                item = document.createElement('li'),
                name = document.createElement('span'),
                type = (this.resolveLocalPath(items[fileName]?.items) || items[fileName])?.type,
                data = Object.assign(
                    { title: fileName },
                    this.#assoc[items[fileName]?.name] || {},
                    this.#types[type] || {},
                    items[fileName]
                ),
                icon = this.renderIcon(
                    Object.assign(this.#types['*'], data)
                );

                item.data = data;

                desktop.applyClasses({
                    default: 'item',
                    prefix: 'no-select',
                    classes: data.type
                }, item);

                name.classList.add('name');
                name.innerText = fileName;

                if (!fileName.includes(' '))
                    name.classList.add('word-wrap');

                item.append(icon);
                item.append(name);

            fragment.append(item);
        });

        return fragment;
    }

    /**
     * Render icon url or font
     *
     * @param {Object} data
     * @return {HTMLElement}
     */
    renderIcon(data) {
        const
            icon = document.createElement('i'),
            isPath = /\/.+\.[0-9-a-z]{3,5}$/.test(data?.icon);

        if (isPath) {
            icon.innerHTML = `<img src="${data?.icon}" />`;
        }

        this.applyClasses({
            default: 'icon',
            prefix: this.#theme?.current?.icon?.prefix,
            classes: !isPath ? data?.icon : 'static'
        }, icon);

        return icon;
    }

    /**
     * Join classes for object
     *
     * @param {Object} data
     * @param {HTMLElement} item
     */
    applyClasses(data, item) {
        let
            classes = [data?.default];
            classes = classes.concat((data?.prefix || '').split(' '));
            classes = classes.concat((data?.classes || '').split(' '));

        classes
            .forEach(cls => cls && item.classList.add(cls));
    }

    /**
     * Select items on click, crtl, shift
     *
     * @param e
     * @param target
     */
    selectItems(e, target) {
        target.parentNode.parentNode.clicked = true;

        const
            items = [...target.parentNode.querySelectorAll('.item')];

        let
            toSel = [
                items.indexOf(items.filter(f => f.matches('.selected'))[0]) || 0,   // Start
                items.indexOf(target)                                               // End
            ].sort((a, b) => a - b);

        items
            .forEach((item, i) => {
                /*Select with Ctrl*/
                if (!e.ctrlKey)
                    item.classList.remove('selected');

                /*Select with Shift*/
                if (e.shiftKey && i >= toSel[0] && i <= toSel[1])
                    item.classList.add('selected');
            });

        if (!e.ctrlKey)
            target.classList.add('selected');
        else
            target.classList.toggle('selected');
    }

    /**
     * Deselect items on by click on empty area
     *
     * @param e
     * @param target
     */
    deselectItems(e, target) {
        if (target.clicked)
            return target.clicked = false;


        [...target.querySelectorAll('.item')]
            .forEach(item => item.classList.remove('selected'));
    }

    /**
     * Find associated app
     *
     * @param type
     * @return Object
     */
    findAssocByType(type) {
        return this.#assoc[
            Object.keys(this.#assoc)
                .filter((name) => this.#assoc[name].types?.includes(type))[0]
        ];
    }

    /**
     * Open item in window
     *
     * @param {Object} data
     */
    openItem(data) {
        if (!data?.type) return;
        if (data?.assoc && data.type !== 'folder') {
            let assoc = Object.assign({ parent: data.parent }, data.assoc);

            delete data.assoc;
            delete data.parent;

            data = Object.assign({}, assoc, { open: data });
        }

        ((() => {
            return new Promise((resolve, reject) => {
                if (typeof data.items === 'string') {
                    data = Object.assign({}, data, this.resolveLocalPath(data.items) || {});
                }

                switch (data.type) {
                    case 'application': {
                        Helper.fetch({ url: `${ data.url }?t=${ new Date().getTime() }` })
                            .then((application) => {
                                application = Helper.resolvePaths(application.toString());

                                try {
                                    const
                                        script = document.createElement('script');
                                        script.setAttribute('type', 'module');
                                        script.setAttribute('application', data.url);
                                        script.innerHTML = `(async () => {\
  const application = await import("data:text/javascript;base64,${ btoa(unescape(encodeURIComponent(application))) }");\
  window.appInit(Object.assign({}, window.appData, application.default(window.appData)));
})()`;
                                    /*On init*/
                                    window.appInit = (data) => {
                                        script.remove();
                                        resolve(data);
                                    };
                                    window.appData = data;
                                    document.head.append(script);
                                } catch (e) {
                                    console.error('An unexpected error occurred while the application was running.', e);
                                }
                            })
                            .catch((e) => console.error('File not found'));

                        break;
                    }

                    default: {
                        if (['folder', 'device'].includes(data?.type)) {
                            const
                                list = document.createElement('ul');
                            list.classList.add('folder-view');
                            list.style.setProperty('--size', this.getActiveSet(this.#views)?.size || '48px');
                            list.append(this.renderItems(data.items));
                            data.title += ' - Viewer';

                            resolve(
                                Object.assign({ content: list }, data)
                            );
                        }
                    }
                }
            });
        })())
            .then((data) => this.jWM.createWindow(data));
    }

    /**
     * Get file contents
     *
     * @param data
     * @return {Promise<unknown | void>}
     */
    getContents(data) {
        return Helper.fetch({ url: `${ data.url }?t=${ new Date().getTime() }` })
            .then((template) => {
                const
                    body = document.createElement('template');
                    body.innerHTML = template.toString();

                return Object.assign({ content: body.content, textContent: template.toString() }, data);
            })
            .catch((e) => console.error(e));
    }

    /**
     * Toggle splashscreen
     *
     * @param hide
     */
    splashScreen(hide = false) {
        if (!hide) {
            this.#splashscreen = document.createElement('div');
            this.#splashscreen.classList.add('splashscreen', 'appear');

            const
                logo = document.createElement('span'),
                load = document.createElement('span');

                logo.classList.add('splashscreen-logo');
                load.classList.add('splashscreen-load');

            this.#splashscreen.append(logo);
            this.#splashscreen.append(load);

            Helper.importStyle(`\
.splashscreen {\
    background-color: rgb(221 221 221);\
    display: flex;\
    flex-direction: column;\
    align-items: center;\
    justify-content: center;\
    position: absolute;\
    top: 0;\
    left: 0;\
    bottom: 0;\
    right: 0;\
    z-index: 3000;\
    transition: all 1s ease-in-out;\
}\
.splashscreen.disappear {\
    opacity: 0;\
}\
.splashscreen-logo {\
    background-image: url(img/jde.svg);\
    background-size: contain;\
    background-repeat: no-repeat;\
    background-position: 50% 40%;\
    height: 50vh;\
    max-height: 475px;\
    width: 50vw;\
}\
.splashscreen-load {\
    background-image: url(img/loader.gif);\
    background-size: contain;\
    background-repeat: no-repeat;\
    background-position: 50% 40%;\
    transition: all .25s ease-in-out;\
    height: 64px;\
    width: 64px;\
}\
.splashscreen.disappear .splashscreen-load {\
    opacity: 0;\
}\
`, this.#splashscreen);

            document.body.append(this.#splashscreen);
        } else {
            setTimeout(() => {
                this.#splashscreen.classList.remove('appear');
                this.#splashscreen.classList.add('disappear');
                setTimeout(() => this.#splashscreen.remove(), 1000);
            }, 2000);
        }
    }

    /**
     * Start given apps after init
     *
     * @param data
     */
    autoRun(data) {
        this.openItem(data);
    }
}

/*Import needed styles*/
Helper.importStyle([ 'css/desktop.css' ]);