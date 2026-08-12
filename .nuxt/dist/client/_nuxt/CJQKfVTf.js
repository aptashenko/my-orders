import{L as f,R as m,av as y,aU as v,aY as B,am as k,V as w,f as P,z as s,A as i,B as d,ad as r,ae as a,C,ac as c,ab as $,D as g,E as h,a9 as D,ah as A,ak as S,aD as L,ai as E}from"./Bp6pVBjP.js";var I=`
    .p-panel {
        display: block;
        border: 1px solid dt('panel.border.color');
        border-radius: dt('panel.border.radius');
        background: dt('panel.background');
        color: dt('panel.color');
    }

    .p-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: dt('panel.header.padding');
        background: dt('panel.header.background');
        color: dt('panel.header.color');
        border-style: solid;
        border-width: dt('panel.header.border.width');
        border-color: dt('panel.header.border.color');
        border-radius: dt('panel.header.border.radius');
    }

    .p-panel-toggleable .p-panel-header {
        padding: dt('panel.toggleable.header.padding');
    }

    .p-panel-title {
        line-height: 1;
        font-weight: dt('panel.title.font.weight');
    }

    .p-panel-content-container {
        display: grid;
        grid-template-rows: 1fr;
    }

    .p-panel-content-wrapper {
        min-height: 0;
    }

    .p-panel-content {
        padding: dt('panel.content.padding');
    }

    .p-panel-footer {
        padding: dt('panel.footer.padding');
    }
`,K={root:function(n){var u=n.props;return["p-panel p-component",{"p-panel-toggleable":u.toggleable}]},header:"p-panel-header",title:"p-panel-title",headerActions:"p-panel-header-actions",pcToggleButton:"p-panel-toggle-button",contentContainer:"p-panel-content-container",contentWrapper:"p-panel-content-wrapper",content:"p-panel-content",footer:"p-panel-footer"},T=f.extend({name:"panel",style:I,classes:K}),N={name:"BasePanel",extends:k,props:{header:String,toggleable:Boolean,collapsed:Boolean,toggleButtonProps:{type:Object,default:function(){return{severity:"secondary",text:!0,rounded:!0}}}},style:T,provide:function(){return{$pcPanel:this,$parentInstance:this}}},V={name:"Panel",extends:N,inheritAttrs:!1,emits:["update:collapsed","toggle"],data:function(){return{d_collapsed:this.collapsed}},watch:{collapsed:function(n){this.d_collapsed=n}},methods:{toggle:function(n){this.d_collapsed=!this.d_collapsed,this.$emit("update:collapsed",this.d_collapsed),this.$emit("toggle",{originalEvent:n,value:this.d_collapsed})},onKeyDown:function(n){(n.code==="Enter"||n.code==="NumpadEnter"||n.code==="Space")&&(this.toggle(n),n.preventDefault())}},computed:{buttonAriaLabel:function(){return this.toggleButtonProps&&this.toggleButtonProps.ariaLabel?this.toggleButtonProps.ariaLabel:this.header},dataP:function(){return w({toggleable:this.toggleable})}},components:{PlusIcon:B,MinusIcon:v,Button:y},directives:{ripple:m}},W=["data-p"],j=["data-p"],z=["id"],M=["id","aria-labelledby"];function R(e,n,u,O,l,t){var b=P("Button");return s(),i("div",a({class:e.cx("root"),"data-p":t.dataP},e.ptmi("root")),[d("div",a({class:e.cx("header"),"data-p":t.dataP},e.ptm("header")),[r(e.$slots,"header",{id:e.$id+"_header",class:$(e.cx("title")),collapsed:l.d_collapsed},function(){return[e.header?(s(),i("span",a({key:0,id:e.$id+"_header",class:e.cx("title")},e.ptm("title")),C(e.header),17,z)):c("",!0)]}),d("div",a({class:e.cx("headerActions")},e.ptm("headerActions")),[r(e.$slots,"icons"),e.toggleable?r(e.$slots,"togglebutton",{key:0,collapsed:l.d_collapsed,toggleCallback:function(p){return t.toggle(p)},keydownCallback:function(p){return t.onKeyDown(p)}},function(){return[g(b,a({id:e.$id+"_header",class:e.cx("pcToggleButton"),"aria-label":t.buttonAriaLabel,"aria-controls":e.$id+"_content","aria-expanded":!l.d_collapsed,unstyled:e.unstyled,onClick:n[0]||(n[0]=function(o){return t.toggle(o)}),onKeydown:n[1]||(n[1]=function(o){return t.onKeyDown(o)})},e.toggleButtonProps,{pt:e.ptm("pcToggleButton")}),{icon:h(function(o){return[r(e.$slots,e.$slots.toggleicon?"toggleicon":"togglericon",{collapsed:l.d_collapsed},function(){return[(s(),D(A(l.d_collapsed?"PlusIcon":"MinusIcon"),a({class:o.class},e.ptm("pcToggleButton").icon),null,16,["class"]))]})]}),_:3},16,["id","class","aria-label","aria-controls","aria-expanded","unstyled","pt"])]}):c("",!0)],16)],16,j),g(E,a({name:"p-collapsible"},e.ptm("transition")),{default:h(function(){return[S(d("div",a({id:e.$id+"_content",class:e.cx("contentContainer"),role:"region","aria-labelledby":e.$id+"_header"},e.ptm("contentContainer")),[d("div",a({class:e.cx("contentWrapper")},e.ptm("contentWrapper")),[d("div",a({class:e.cx("content")},e.ptm("content")),[r(e.$slots,"default")],16),e.$slots.footer?(s(),i("div",a({key:0,class:e.cx("footer")},e.ptm("footer")),[r(e.$slots,"footer")],16)):c("",!0)],16)],16,M),[[L,!l.d_collapsed]])]}),_:3},16)],16,W)}V.render=R;export{V as default};
