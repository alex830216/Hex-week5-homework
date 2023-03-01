const { createApp } = Vue;

Object.keys(VeeValidateRules).forEach((rule) => {
  if (rule !== "default") {
    VeeValidate.defineRule(rule, VeeValidateRules[rule]);
  }
});

VeeValidateI18n.loadLocaleFromURL("./zh_TW.json");

VeeValidate.configure({
  generateMessage: VeeValidateI18n.localize("zh_TW"),
  validateOnInput: true, // 調整為：輸入文字時，就立即進行驗證
});

const apiUrl = "https://vue3-course-api.hexschool.io/v2";
const apiPath = "alex-test";

const productModal = {
  props: ["id", "addToCart", "openModal"],
  data() {
    return {
      modal: {},
      tempProdut: {},
      qty: 1,
    };
  },
  template: "#userProductModal",
  // 當 id 改變時(原本id是空的，點擊後傳入產品id)，取得遠端資料，並呈現 Modal
  watch: {
    id() {
      if (this.id) {
        this.loadingItem = this.id;
        axios.get(`${apiUrl}/api/${apiPath}/product/${this.id}`).then((res) => {
          this.tempProdut = res.data.product;
          this.modal.show();
          this.loadingItem = "";
        });
      }
    },
  },
  methods: {
    hide() {
      this.modal.hide();
    },
  },
  mounted() {
    this.modal = new bootstrap.Modal(this.$refs.modal);
    // 監聽 modal，當 modal 關閉時清空產品 id，讓 watch 可以正常運作
    this.$refs.modal.addEventListener("hidden.bs.modal", (event) => {
      this.openModal("");
    });
  },
};

const app = createApp({
  data() {
    return {
      products: [],
      productId: "",
      cart: {},
      loadingItem: "", // 存 id
      form: {
        user: {
          name: "",
          email: "",
          tel: "",
          address: "",
        },
        message: "",
      },
    };
  },
  methods: {
    getProducts() {
      axios.get(`${apiUrl}/api/${apiPath}/products/all`).then((res) => {
        this.products = res.data.products;
      });
    },
    openModal(id) {
      this.productId = id;
    },
    addToCart(product_id, qty = 1) {
      this.loadingItem = product_id;
      // *可以做區塊或全畫面的讀取*
      const data = {
        // 縮寫
        product_id,
        qty,
      };
      // { data } 也是縮寫，data外面還要包一層{}才是正確格式
      axios.post(`${apiUrl}/api/${apiPath}/cart`, { data }).then(() => {
        this.$refs.productModal.hide();
        this.getCarts();
        this.loadingItem = "";
      });
    },
    getCarts() {
      // *可以做區塊或全畫面的讀取*
      axios.get(`${apiUrl}/api/${apiPath}/cart`).then((res) => {
        this.cart = res.data.data;
      });
    },
    updateCart(item) {
      const data = {
        product_id: item.product.id,
        qty: item.qty,
      };
      this.loadingItem = item.id;
      axios
        .put(`${apiUrl}/api/${apiPath}/cart/${item.id}`, { data })
        .then((res) => {
          this.cart = res.data.data;
          this.getCarts();
          this.loadingItem = "";
        });
    },
    deleteCart(item) {
      this.loadingItem = item.id;
      axios.delete(`${apiUrl}/api/${apiPath}/cart/${item.id}`).then(() => {
        this.getCarts();
        this.loadingItem = "";
      });
    },
    deleteCarts() {
      axios.delete(`${apiUrl}/api/${apiPath}/carts`).then(() => {
        this.getCarts();
      });
    },
    createOrder() {
      const data = this.form;
      axios.post(`${apiUrl}/api/${apiPath}/order`, { data }).then(() => {
        // 清除form資料，veevalidate提供的方法
        this.$refs.form.resetForm();
        this.form.message = "";
        this.getCarts();
      });
    },
  },
  components: {
    productModal,
  },
  mounted() {
    this.getProducts();
    this.getCarts();
  },
});

// 全域註冊
// app.component("productModal", productModal);

app.component("VForm", VeeValidate.Form);
app.component("VField", VeeValidate.Field);
app.component("ErrorMessage", VeeValidate.ErrorMessage);

app.mount("#app");
