import { B as BaseStyle, l as script$2 } from "../server.mjs";
import { openBlock, createElementBlock, mergeProps, renderSlot } from "vue";
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
  root: "p-tabpanels"
};
var TabPanelsStyle = BaseStyle.extend({
  name: "tabpanels",
  classes
});
var script$1 = {
  name: "BaseTabPanels",
  "extends": script$2,
  props: {},
  style: TabPanelsStyle,
  provide: function provide() {
    return {
      $pcTabPanels: this,
      $parentInstance: this
    };
  }
};
var script = {
  name: "TabPanels",
  "extends": script$1,
  inheritAttrs: false
};
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", mergeProps({
    "class": _ctx.cx("root"),
    role: "presentation"
  }, _ctx.ptmi("root")), [renderSlot(_ctx.$slots, "default")], 16);
}
script.render = render;
export {
  script as default
};
//# sourceMappingURL=index-Drr40LuC.js.map
