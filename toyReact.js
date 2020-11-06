import { IgnorePlugin } from "webpack";

const RENDER_TO_DOM = Symbol('render to dom')

export class Component{
    constructor(content){
        this.props = Object.create(null);
        this.children = [];
        this._root = null;
        this._range = null;
    }
    setAttribute(name, value){
        this.props[name] = value
    }
    appendChild(component){
        this.children.push(component)
    }
    
    [RENDER_TO_DOM](range){
        this._range = range;
        this._vdom = this.vdom;
        this._vdom[RENDER_TO_DOM](range);
    }
    get vdom(){
        return this.render().vdom;
    }
    get vchildren(){
        return this.children.map(child =>child.vdom);
    }
    // vdom比对
    update(){
        let isSameNode = (oldNode, newNode)=>{
            if(oldNode.type !== newNode.type){
                return false
            }
            for(let name in newNode.props){
                if(newNode.props[name] !== oldNode.props[name]){
                    return false
                }
            }
            if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length){
                return false
            }
            if(newNode.type === '#text'){
                if(newNode.content !== oldNode.content){
                    return false;
                }
            }
            return true
        }
        let update = (oldNode, newNode) =>{
        
        }
        let vdom = this.vdom;
        update(this._vdom, vdom);
        this._vdom = vdom
    }
    /*rerender(){
        let oldRange = this._range;

        let range = document.createRange();
        range.setStart(oldRange.startContainer, oldRange.startOffset);
        range.setEnd(oldRange.endContainer, oldRange.startOffset);
        this[RENDER_TO_DOM](range);

        oldRange.setStart(range.endContainer, range.endOffset);
        oldRange.deleteContents();
    }*/
    setState(newState){
        if(this.state === null || typeof this.state !== 'object'){
            this.state = newState;
            this.rerender();
            return;
        }
        let merge = (oldState, newState)=>{
            for(let p in newState){
                if(oldState[p] === null || typeof oldState[p] !== 'object'){
                    oldState[p] = newState[p];
                }else{
                    merge(oldState[p], newState[p])
                }
            }
            
        }
        merge(this.state, newState)
        this.update()
    }
}
// 根据createElement中的实现倒推
class ElementWrapper extends Component{
    constructor(type){
        super()
        this.root = document.createElement(type);
        this.type = type;
    }
    /*
    setAttribute(name, value){
        if(name.match(/^on([\s\S]+)$/)){
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/,c=>c.toLocaleLowerCase()), value);
        }else{
            if(name === 'className'){
                this.root.setAttribute('class', value)
            }else{
                this.root.setAttribute(name, value)
            }
            
        }
    }
    appendChild(component){
        let range = document.createRange();
        range.setStart(this.root, this.root.childNodes.length);
        range.setEnd(this.root, this.root.childNodes.length);
        component[RENDER_TO_DOM](range);
    }*/
    get vdom(){
        return this;
    }
    [RENDER_TO_DOM](range){
        range.deleteContents();
        // root
        let root = document.createElement(this.type);
        // props
        for(let name in this.props){
            let value = this.props[name];
            if(name.match(/^on([\s\S]+)$/)){
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/,c=>c.toLocaleLowerCase()), value);
            }else{
                if(name === 'className'){
                    root.setAttribute('class', value)
                }else{
                    root.setAttribute(name, value)
                }
                
            }
        }
        // children
        for(let child of this.children){
            let childRange = document.createRange();
            childRange.setStart(root, root.childNodes.length);
            childRange.setEnd(root, root.childNodes.length);
            child[RENDER_TO_DOM](childRange);
        }
        range.insertNode(root);
    }
}
class TextWrapper extends Component{
    constructor(content){
        super();
        this.type = "#text";
        this.content = content;
        this.root = document.createTextNode(content)
    }
    get vdom(){
        return this;
    }
    [RENDER_TO_DOM](range){
        range.deleteContents();
        range.insertNode(this.root);
    }
}

export function createElement(type,attributes,...children){
    let e;
    // 支持原生标签
    if(typeof type === 'string'){
        e = new ElementWrapper(type)
    }else{
        // 支持自定义标签
        e = new type
    }
    for(let p in attributes){
        e.setAttribute(p, attributes[p]);
    }
    let insertChildren = (children) =>{
        for(let child of children){
            if(typeof child === 'string'){
                child = new TextWrapper(child)
            }
            if(child === null){
                continue
            }
            if(typeof child === 'object' && child instanceof Array){
                insertChildren(child)
            }else{
                e.appendChild(child)
            }
        }
    }
    insertChildren(children)
    
    return e
}
export function render(component, parentElement){
    let range = document.createRange();
    range.setStart(parentElement,0);
    range.setEnd(parentElement, parentElement.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range)
}