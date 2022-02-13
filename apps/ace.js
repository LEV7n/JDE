import Helper from "@/js/classes/helper.js";
import * as Ace from "@/js/vendor/ace/ace.js";

/**
 * Ace Editor handler
 * Developed By Michael Levinez
 *
 * @class Editor
 */
class Editor {
    data = {};
    holder;
    editor;

    /**
     * Initialize
     *
     * @param {Object} data
     * @return Editor
     */
    constructor(data) {
        ace.config.set('basePath', '/js/vendor/ace/');

        this.data = data;

        /*Insert file content*/
        if (this.data.open?.url) {
            desktop.getContents(this.data?.open)
                .then((file) => {
                    this
                        .addEditor()
                        .setReadOnly()
                        .addContent(file?.textContent);
                });
        } else {
            /*Initialize after injection*/
            setTimeout(() => this.addEditor(), 1);
        }
    }

    /**
     * Create and init editor
     *
     * @param {String} [id]
     * @return Editor
     */
    addEditor(id) {
        this.holder.id = new Date().getTime() + Helper.randomInt(0, 99999);

        this.editor = ace.edit(this.holder);
        this.editor.setOptions({
            fixedWidthGutter: true,
            copyWithEmptySelection: true,
            showPrintMargin: false,
            scrollPastEnd: 0.5,
            theme: 'ace/theme/monokai',
            mode: `ace/mode/${ this.data?.open?.mimeType?.split('/')[1] || 'text' }`
        });

        return this;
    }

    /**
     * Add content to editor
     *
     * @param content
     * @return Editor
     */
    addContent(content) {
        this.editor?.setValue(content, -1);

        return this;
    }

    /**
     * Make content read-only
     *
     * @param {Boolean} [flag]
     * @return Editor
     */
    setReadOnly(flag = true) {
        this.editor?.setReadOnly(true);

        return this;
    }

    /**
     * Window toggle handler
     *
     * @return Editor
     */
    onResize() {
        setTimeout(() => this.editor?.resize(), 100);

        return this;
    }

    /**
     * Render given info
     * @return DocumentFragment
     */
    render() {
        const fragment = new DocumentFragment();
        this.holder = document.createElement('div');

        /*Append editor*/
        fragment.append(this.holder);

        return fragment
    }
}

/**
 * Launch application
 *
 * @param data
 * @return {{title: string, content: DocumentFragment}}
 */
export default (data) => {
    const
        editor = new Editor(data),
        content = editor.render();

    /*Import needed styles*/
    Helper.importStyle([ 'css/ace.css' ], content);

    return {
        title: `${ (data?.open?.title || 'untitled') + (data?.open ? ' [Read-only]' : '') } - ${ data?.title }`,
        content: content,
        events: {
            onResize: () => editor.onResize(),
            onToggle: () => editor.onResize()
        }
    };
};