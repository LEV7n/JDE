import Helper from "./helper.js";
import Window from './window.js';

/**
 * Create desktop environment
 * Developed By Michael Levinez
 *
 * @class Desktop
 */
export default class Desktop {
    #paper = {};
    #items = {};
    #types = {};
    #assoc = {};
    #views = {};

    #splashscreen;

    /**
     * Initialize
     *
     * @param {Object} [data]
     * @param {String} [data.items]
     * @param {String} [data.types]
     * @param {String} [data.assoc]
     * @param {Array} [data.autorun]
     * @return Desktop
     */
    constructor(data = {}) {
        this.#loadConfiguration({
            items: data?.items || '../../conf/desktop.json',
            types: data?.types || '../../conf/filetypes.json',
            assoc: data?.assoc || '../../conf/associations.json'
        })
            .then((config) => {
                this.#paper = config[0]?.wallpapers;
                this.#views = config[0]?.views;
                this.#items = config[0]?.items;
                this.#types = config[1];
                this.#assoc = config[2];

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
        this.wrapper.style.backgroundImage = `url("${ this.#paper?.images.filter(f => f.active)[0].url }")`;

        this.holder.classList.add('desktop-holder');
        this.holder.append(this.desktop);

        /*Render desktop items*/
        this.desktop.classList.add('desktop');
        this.desktop.style.setProperty('--size', this.#views?.filter(f => f.active)[0].size || 48);
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
                icon = document.createElement('i'),
                name = document.createElement('span'),
                data = Object.assign(
                    { title: fileName },
                    this.#assoc[items[fileName]?.name] || {},
                    this.#types[items[fileName].type] || {},
                    items[fileName]
                ),
                isPath = /\/.+\.[0-9-a-z]{3,5}$/.test(data?.icon);

                item.data = data;
                item.classList.add('item', 'no-select');

                icon.classList.add('icon', !isPath ? 'material-icons-outlined' : 'static');
                icon.innerHTML = !isPath ? (data?.icon || 'question_mark') : `<img src="${ data?.icon }" />`;

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
                switch (data.type) {
                    case 'folder': {
                        const
                            list = document.createElement('ul');
                            list.classList.add('folder-view');
                            list.style.setProperty('--size', this.#views?.filter(f => f.active)[0].size || 48);
                            list.append(this.renderItems(data.items));
                            data.title += ' - Viewer';

                        resolve(
                            Object.assign({ content: list }, data)
                        );

                        break;
                    }

                    case 'application': {
                        Helper.fetch({ url: `${ data.url }?t=${ new Date().getTime() }` })
                            .then((application) => {
                                application = this.resolvePaths(application.toString());

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
     * Change relative path to absolute
     *
     * @param {String} string
     * @param {RegExp} [regex]
     * @return String
     */
    resolvePaths(string, regex = /import.*from.*['"](?<path>.*)['"];?/g) {
        const
            matches = {
                '@': location.origin // Replace import @ chars to root
            };

        [...string.matchAll(regex)].forEach(({ groups }) => {
            let replacement = groups?.path;

            Object.keys(matches).map(m => replacement = replacement.replace(m, matches[m]));

            string = string.replace(groups?.path, replacement);
        });

        return string;
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
Helper.importStyle([
    'https://fonts.googleapis.com/css2?family=Saira:wght@200&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Icons+Outlined&v=1644038177257',
    'css/desktop.css'
]);