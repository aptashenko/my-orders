import { B as BaseStyle, l as script$2 } from "../server.mjs";
import { renderSlot } from "vue";
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
var AccordionTabStyle = BaseStyle.extend({
  name: "accordiontab"
});
var script$1 = {
  name: "BaseAccordionTab",
  "extends": script$2,
  props: {
    header: null,
    headerStyle: null,
    headerClass: null,
    headerProps: null,
    headerActionProps: null,
    contentStyle: null,
    contentClass: null,
    contentProps: null,
    disabled: Boolean
  },
  style: AccordionTabStyle,
  provide: function provide() {
    return {
      $pcAccordionTab: this,
      $parentInstance: this
    };
  }
};
var script = {
  name: "AccordionTab",
  "extends": script$1,
  inheritAttrs: false,
  mounted: function mounted() {
    console.warn("Deprecated since v4. Use the new structure of Accordion instead.");
  }
};
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return renderSlot(_ctx.$slots, "default");
}
script.render = render;
export {
  script as default
};
//# sourceMappingURL=index-i-hxHSiE.js.map
