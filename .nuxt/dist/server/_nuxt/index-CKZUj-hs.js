import { B as BaseStyle, l as script$2 } from "../server.mjs";
import { style } from "@primeuix/styles/progressspinner";
import { openBlock, createElementBlock, mergeProps, createElementVNode } from "vue";
import "/Users/a1111/PhpstormProjects/my-orders/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/a1111/PhpstormProjects/my-orders/node_modules/hookable/dist/index.mjs";
import "/Users/a1111/PhpstormProjects/my-orders/node_modules/unctx/dist/index.mjs";
import "/Users/a1111/PhpstormProjects/my-orders/node_modules/h3/dist/index.mjs";
import "/Users/a1111/PhpstormProjects/my-orders/node_modules/ufo/dist/index.mjs";
import "/Users/a1111/PhpstormProjects/my-orders/node_modules/defu/dist/defu.mjs";
import "@primeuix/utils/eventbus";
import "@primeuix/styled";
import "@primeuix/utils";
import "@primeuix/utils/object";
import "@primeuix/styles/base";
import "@primeuix/utils/dom";
import "vue/server-renderer";
import "@primeuix/styles/slider";
import "@primeuix/styles/inputtext";
import "@primeuix/styles/inputnumber";
import "@primeuix/utils/zindex";
import "@primeuix/styles/iconfield";
import "@primeuix/utils/uuid";
import "@primeuix/styles/ripple";
import "@primeuix/styles/virtualscroller";
import "@primeuix/styles/select";
import "@primeuix/styles/badge";
import "@primeuix/styles/button";
import "@primeuix/styles/dialog";
import "@primeuix/styles/textarea";
import "@primeuix/styles/progressbar";
import "@primeuix/styles/paginator";
import "@primeuix/styles/datatable";
import "@primeuix/styles/checkbox";
import "@primeuix/styles/radiobutton";
import "@primeuix/styles/message";
import "@primeuix/styles/tag";
import "/Users/a1111/PhpstormProjects/my-orders/node_modules/ohash/dist/index.mjs";
import "@vue/shared";
import "/Users/a1111/PhpstormProjects/my-orders/node_modules/perfect-debounce/dist/index.mjs";
var classes = {
  root: "p-progressspinner",
  spin: "p-progressspinner-spin",
  circle: "p-progressspinner-circle"
};
var ProgressSpinnerStyle = BaseStyle.extend({
  name: "progressspinner",
  style,
  classes
});
var script$1 = {
  name: "BaseProgressSpinner",
  "extends": script$2,
  props: {
    strokeWidth: {
      type: String,
      "default": "2"
    },
    fill: {
      type: String,
      "default": "none"
    },
    animationDuration: {
      type: String,
      "default": "2s"
    }
  },
  style: ProgressSpinnerStyle,
  provide: function provide() {
    return {
      $pcProgressSpinner: this,
      $parentInstance: this
    };
  }
};
var script = {
  name: "ProgressSpinner",
  "extends": script$1,
  inheritAttrs: false,
  computed: {
    svgStyle: function svgStyle() {
      return {
        "animation-duration": this.animationDuration
      };
    }
  }
};
var _hoisted_1 = ["fill", "stroke-width"];
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", mergeProps({
    "class": _ctx.cx("root"),
    role: "progressbar"
  }, _ctx.ptmi("root")), [(openBlock(), createElementBlock("svg", mergeProps({
    "class": _ctx.cx("spin"),
    viewBox: "25 25 50 50",
    style: $options.svgStyle
  }, _ctx.ptm("spin")), [createElementVNode("circle", mergeProps({
    "class": _ctx.cx("circle"),
    cx: "50",
    cy: "50",
    r: "20",
    fill: _ctx.fill,
    "stroke-width": _ctx.strokeWidth,
    strokeMiterlimit: "10"
  }, _ctx.ptm("circle")), null, 16, _hoisted_1)], 16))], 16);
}
script.render = render;
export {
  script as default
};
//# sourceMappingURL=index-CKZUj-hs.js.map
