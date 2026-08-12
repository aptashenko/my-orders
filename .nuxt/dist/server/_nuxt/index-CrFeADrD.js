import { uuid } from "@primeuix/utils";
import { B as BaseStyle, m as script$2 } from "../server.mjs";
import { style } from "@primeuix/styles/radiobuttongroup";
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
  root: "p-radiobutton-group p-component"
};
var RadioButtonGroupStyle = BaseStyle.extend({
  name: "radiobuttongroup",
  style,
  classes
});
var script$1 = {
  name: "BaseRadioButtonGroup",
  "extends": script$2,
  style: RadioButtonGroupStyle,
  provide: function provide() {
    return {
      $pcRadioButtonGroup: this,
      $parentInstance: this
    };
  }
};
var script = {
  name: "RadioButtonGroup",
  "extends": script$1,
  inheritAttrs: false,
  data: function data() {
    return {
      groupName: this.name
    };
  },
  watch: {
    name: function name(newValue) {
      this.groupName = newValue || uuid("radiobutton-group-");
    }
  },
  mounted: function mounted() {
    this.groupName = this.groupName || uuid("radiobutton-group-");
  }
};
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", mergeProps({
    "class": _ctx.cx("root")
  }, _ctx.ptmi("root")), [renderSlot(_ctx.$slots, "default")], 16);
}
script.render = render;
export {
  script as default
};
//# sourceMappingURL=index-CrFeADrD.js.map
