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
    get vdom(){
        
        return this.render().vdom;
    }
    // get vchildren(){
    //     return this.children.map(child =>child.vdom);
    // }
    [RENDER_TO_DOM](range){
        this._range = range;
        this._vdom = this.vdom;
        this._vdom[RENDER_TO_DOM](range);
    }
    // vdom比对
    update(){
        let isSameNode = (oldNode, newNode)=>{
            // type diff
            if(oldNode.type !== newNode.type){
                return false
            }
            // props diff
            for(let name in newNode.props){
                if(newNode.props[name] !== oldNode.props[name]){
                    return false
                }
            }
            // props length diff
            if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length){
                return false
            }
            // textNode content diff
            if(newNode.type === '#text'){
                if(newNode.content !== oldNode.content){
                    return false;
                }
            }
            return true
        }
        let update = (oldNode, newNode) =>{
            // node
            if(!isSameNode(oldNode, newNode)){
                newNode[RENDER_TO_DOM](oldNode._range)
                return 
            }
            newNode._range = oldNode._range
            // children
            
            let newChildren = newNode.vchildren;
            let oldChildren = oldNode.vchildren;
            if(!newChildren || !newChildren.length){
                return
            }
            let tailRange = oldChildren[oldChildren.length - 1]._range;
            for(let i=0; i < newChildren.length; i++){
                let newChild = newChildren[i];
                let oldChild = oldChildren[i];
                if(i < oldChildren.length){
                    update(oldChild, newChild)
                }else{
                    let range = document.createRange();
                    range.setStart(tailRange.endContainer, tailRange.endOffset);
                    range.setEnd(tailRange.endContainer, tailRange.endOffset);
                    newChild[RENDER_TO_DOM](range);
                    tailRange = range;
                }
            }
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
            this.update();
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
        this.vchildren = this.children.map(child => child.vdom)
        return this;
    }
    [RENDER_TO_DOM](range){
        this._range = range;
        // range.deleteContents();
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
        if(!this.vchildren){
            this.vchildren = this.children.map(child => child.vdom);
        }
        // children
        for(let child of this.vchildren){
            let childRange = document.createRange();
            childRange.setStart(root, root.childNodes.length);
            childRange.setEnd(root, root.childNodes.length);
            child[RENDER_TO_DOM](childRange);
        }
        // range.insertNode(root);
        replaceContent(range, root);
    }
}
class TextWrapper extends Component{
    constructor(content){
        super();
        this.type = "#text";
        this.content = content;
        
    }
    get vdom(){
        return this;
    }
    [RENDER_TO_DOM](range){
        this._range = range;
        // range.deleteContents();
        // range.insertNode(this.root);
        let root = document.createTextNode(this.content)
        replaceContent(range, root)
    }
}
function replaceContent(range,node){
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();

    range.setStartBefore(node);
    range.setEndAfter(node);

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