/**
 * Create desktop environment
 * Developed By Michael Levinez
 *
 * @class Helper
 */
class Helper {
    /**
     * Generate random int between min and max
     *
     * @param {number} min
     * @param {number} max
     * @return {number}
     */
    randomInt(min = 0, max = 0) {
        this.active = true; // Set active state to true - means parser works

        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * Import style to parent
     *
     * @prop file
     * @prop {HTMLElement} [parent]
     */
    importStyle(file, parent = document.head) {
        const
            style = document.createElement('style'),
            type = (f) => {
                if (f.includes('http'))
                    return `@import url("${ f }")`;
                else if (f.includes('{'))
                    return f;
                else
                    return `@import "${ f }"`
            },
            data = (() => {
                if (Array.isArray(file))
                    return file.map((f) => type(f)).join(';\n');
                else if (typeof file === 'string')
                    return type(file);
            })(),
            node = document.createTextNode(data);

        style.setAttribute('type', 'text/css');
        style.append(node);

        parent.append(style);
    }

    /**
     * Check is given param is function
     *
     * @param fn
     * @return {boolean}
     */
    isFunc(fn) {
        return typeof fn === 'function';
    }

    /**
     * Fetch request
     *
     * @param request
     * @return Promise
     */
    fetch(request) {
        let
            options = {
                method: 'GET',
                url: '',
                contentType: 'html',
                responseType: 'text',
                data: {},
                beforeSend: new Function()
            },
            headers = new Headers(),
            scp = Object.assign({}, options, request),
            body = (() => {
                switch (scp.contentType) {
                    case 'application/x-www-form-urlencoded': {
                        return new URLSearchParams();
                    }

                    case 'application/json': {
                        scp.responseType = 'json';
                        return {};
                    }

                    default: {
                        return new FormData();
                    }
                }
            })();

        if (this.isFunc(scp.beforeSend)) scp.beforeSend.call(this, headers, scp);
        scp.body = body;

        /*Prepare url and options*/
        const
            { url, params } = (() => {
                switch (scp?.method) {
                    case 'GET': {
                        delete scp.body;
                        return { url: scp.url, params: scp };
                    }

                    case 'POST': {
                        scp.data.forEach((value, key) => {
                            if (this.isFunc(body.append)) body.append(key, value);
                            else body[key] = value;
                        });

                        if (!this.isFunc(body.append)) {
                            body = JSON.stringify(scp.data);
                        }

                        return { url: scp.url, params: Object.assign({}, { body: body }, scp) };
                    }
                }
            })();

        return fetch(url, params)
            .then((scope) => {
                if (scope.status >= 200 && scope.status <= 299)
                    return scope[scp.responseType]()
                        .then((response) => response);
                else
                    throw Error(scope.statusText);
            })
    }

    /**
     * Delegate event
     * https://youmightnotneedjquery.com/
     *
     * @param {String} events
     * @param {String} selector
     * @param {Function} handler
     */
    delegate(events, selector, handler) {
        events.split(' ').forEach((event) => {
            document.addEventListener(event, function(e) {
                // loop parent nodes from the target to the delegation node
                for (let target = e.target; target && target !== this; target = target.parentNode) {
                    if (target.matches(selector)) {
                        handler.call(target, e, target);
                        break;
                    }
                }
            }, false);
        });
    }
}

export default new Helper();