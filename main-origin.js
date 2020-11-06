// for(let i of [1,2,3]){
//     console.log(i)
// }
import {createElement,Component,render} from './toyReact.js'
class MyComponent extends Component{
    constructor(){
        super()
        this.state = {
            a:1,
            b:2
        }
    }
    render(){
		return <div>
            <h3>组件重新渲染</h3>
            <button onclick ={() =>{this.setState({a: this.state.a + 1})}}>点击自增</button>
            <p>state a的值：{this.state.a.toString()}</p>
            <p>state b的值：{this.state.b.toString()}</p>
            {this.children}
        </div>
    }
}


render(<MyComponent id="a" class="b">
<div>子节点
</div>
</MyComponent>,document.body)
/*document.body.appendChild(<MyComponent id="a" class="b">
    <div>a
    <span>b</span>
    <span>c</span>
    <span>d</span>
</div>
<div>e</div>
<div>f</div>
<span>g</span>
</MyComponent>)*/
