import Helper from "@/js/classes/helper.js";

/**
 * Composite and render user bio
 * Developed By Michael Levinez
 *
 * @class Bio
 */
class Bio {
    /*Class defaults*/
    profile = { Name: '', Born: '', Location: [], Photo: '', About: '' };
    skills = [];

    /**
     * Add person data
     *
     * @param {Object} data
     * @return Bio
     */
    addPerson(data) {
        this.profile = Object.assign({}, this.profile, data);

        return this;
    }

    /**
     * Add skills to stack
     *
     * @param {Array, Object} skill
     * @return Bio
     */
    addSkills(skill) {
        if (Array.isArray(skill))
            this.skills = this.skills.concat(skill);
        else if (skill.hasOwnProperty('Name'))
            this.skills.push(skill);

        return this;
    }

    /**
     * Render given info
     * @return DocumentFragment
     */
    render() {
        const
            data = Object.assign({}, this.profile, { Skills: this.skills }),
            fragment = document.createDocumentFragment(),
            table = document.createElement('table'),
            tbody = document.createElement('tbody');

        Object.keys(data).forEach((key) => {
            const
                row = document.createElement('tr'),
                heading = document.createElement('th'),
                content = document.createElement('td');

            heading.setAttribute('width', '80px');
            heading.style.fontWeight = 'bold';
            heading.innerText = `${ key }:`;

            content.innerHTML = (() => {
                switch (key) {
                    case 'Born': return `<b>${ new Date(data[key]).toISOString() }<b/>`;
                    case 'Location': return `<b>${ data[key].join(', ') }<b/>`;
                    case 'Photo': return `<img src="${ data[key] }" width="150px" />`;
                    case 'About': return `<span style="font-weight:bold;">${ data[key] }</span>`;
                    case 'Skills': {
                        return data[key].map((skill) => {
                            return `<b>${ skill.Name }</b>\
${ skill.Frameworks ? `: (${ skill.Frameworks.map((m) => m).join(', ') }),` : ',' } \
<i>Since: <b>${ skill.Since }</b> year.</i>`
                        }).join('<br>');
                    }
                    default: return `<b>${ data[key] }<b/>`;
                }
            })();

            row.append(heading);
            row.append(content);
            tbody.append(row);
        });

        table.append(tbody);
        fragment.append(table);

        return fragment;
    }
}

/**
 * Launch application
 *
 * @return {{title: string, content: DocumentFragment}}
 */
export default () => {
    /*Create user bio*/
    const
        person = new Bio()
            .addPerson({
                Name: 'Michael Levinez', Born: '03/12/1989 09:15 GMT+3', Location: [ '55°9.2412′N', '61°25.749′E' ],
                Photo: `img/photo${ Helper.randomInt(1, 3) }.jpg`,
                About: `Hello! I am a senior javascript developer.<br>\
In 12 years of work experience I've developed numerous hard level tasks,<br>\
including JavaScript programming using various frameworks and  Chrome Extensions.<br>\
In addition I'm quite skilled with Vue.js (router, vuex).<br>\
Also I'm well acquainted with php programming.<br>\
I've worked with laravel, DBMS like MySQL/MariaDB, PostgreSQL, Mongo.<br>\
Currently in the middle of Kotlin training to create Android apps.<br>\
<br>\
P.S.<br>\
This project is a simulation of the desktop shell developed with JavaScript in my free time.<br>\
In the folder "How it works" you can check  the structure of the project, and also download a prototype "JDE.zip".<br>\
Project's repo on Github <a href="https://github.com/LEV7n/JDE" target="_blank">here</a>.`
            })
            .addSkills([
                { Name: 'HTML 4.1/5', Since: '2010' },
                { Name: 'CSS 2.1/3', Since: '2010' },
                { Name: 'Javascript', Frameworks: [ 'jQuery', 'MooTools', 'Prototype' ], Since: '2011' },
                { Name: 'Javascript', Frameworks: [ 'Zepto', 'Angular', 'React', 'Backbone', 'Vue.js' ], Since: '2015' },
                { Name: 'DB', Frameworks: [ 'MySQL/MariaDB', 'PostgreSQL', 'Mongo' ], Since: '2012' },
                { Name: 'Chrome Extensions', Since: '2015' },
                { Name: 'PHP', Frameworks: [ 'Laravel' ], Since: '2020' },
                { Name: 'Kotlin', Since: '2021' },
            ]);

    return {
        title: `${ person.profile.Name }'s Bio`,
        content: person.render()
    };
};