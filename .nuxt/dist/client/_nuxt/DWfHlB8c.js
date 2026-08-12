import{L as a,ap as r,aq as e,z as n,A as s,ad as p,ae as u}from"./Bp6pVBjP.js";var i=`
    .p-radiobutton-group {
        display: inline-flex;
    }
`,d={root:"p-radiobutton-group p-component"},c=a.extend({name:"radiobuttongroup",style:i,classes:d}),l={name:"BaseRadioButtonGroup",extends:r,style:c,provide:function(){return{$pcRadioButtonGroup:this,$parentInstance:this}}},m={name:"RadioButtonGroup",extends:l,inheritAttrs:!1,data:function(){return{groupName:this.name}},watch:{name:function(o){this.groupName=o||e("radiobutton-group-")}},mounted:function(){this.groupName=this.groupName||e("radiobutton-group-")}};function f(t,o,g,h,$,v){return n(),s("div",u({class:t.cx("root")},t.ptmi("root")),[p(t.$slots,"default")],16)}m.render=f;export{m as default};
