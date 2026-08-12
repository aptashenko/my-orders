import { B as BaseStyle, l as script$2 } from "../server.mjs";
import "vue";
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
var ColumnGroupStyle = BaseStyle.extend({
  name: "columngroup"
});
var script$1 = {
  name: "BaseColumnGroup",
  "extends": script$2,
  props: {
    type: {
      type: String,
      "default": null
    }
  },
  style: ColumnGroupStyle,
  provide: function provide() {
    return {
      $pcColumnGroup: this,
      $parentInstance: this
    };
  }
};
var script = {
  name: "ColumnGroup",
  "extends": script$1,
  inheritAttrs: false,
  inject: ["$columnGroups"],
  mounted: function mounted() {
    var _this$$columnGroups;
    (_this$$columnGroups = this.$columnGroups) === null || _this$$columnGroups === void 0 || _this$$columnGroups.add(this.$);
  },
  unmounted: function unmounted() {
    var _this$$columnGroups2;
    (_this$$columnGroups2 = this.$columnGroups) === null || _this$$columnGroups2 === void 0 || _this$$columnGroups2["delete"](this.$);
  },
  render: function render() {
    return null;
  }
};
export {
  script as default
};
//# sourceMappingURL=index-tj9f93uQ.js.map
