<script setup lang="ts">
import { reactive, onMounted, watch, ref } from 'vue';
import { getProductsFromExternalApi, IProduct } from './data';
import { pool } from 'parallelizer-function';
let dataProduct = reactive<{ products: IProduct[]; meta: any }>({ products: [], meta: {} });
let isLoading = ref(false);
pool.setMaxWorkers(4);

async function getExternalData() {
  try {
    isLoading.value = true;
    let data: {
      products: Array<IProduct>;
      meta: any;
    } = await pool.exec(getProductsFromExternalApi);
    dataProduct.products = data.products;
    dataProduct.meta = data.meta;
  } catch (e: any) {
    console.error(e);
  }
  isLoading.value = false;
}

watch(
  () => dataProduct.products,
  (newProducts: IProduct[]) => {
    console.log(newProducts);
  }
);

onMounted(() => {
  getExternalData();
});
</script>

<template>
  <div class="toolbar" role="banner">
    <img width="40" alt="Angular Logo" src="./assets/vue.svg" />
    <span style="margin-left: 16px">Welcome Vue</span>
    <div class="spacer"></div>
  </div>

  <div class="content" role="main">
    <p style="font-size: 1.2rem">
      In this example, we are using <strong>parallelizer-function</strong> to perform calling to an
      external API that provides the data with pagination. Then we execute the requests in parallel
      in another thread and perform some data processing.
    </p>
    <h2 v-if="isLoading">Loading...</h2>
    <template v-if="!isLoading && dataProduct.products && dataProduct?.meta">
      <h3>Sample of computation data</h3>
      <table class="table">
        <thead>
          <tr>
            <th>rating>4</th>
            <th>{{ 'rating<3' }}</th>
            <th># out stock</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ dataProduct?.meta?.moreThan4Rate }}</td>
            <td>{{ dataProduct?.meta?.lessThan3Rate }}</td>
            <td>{{ dataProduct?.meta?.productOutOfStock?.length }}</td>
          </tr>
        </tbody>
      </table>
      <hr />
      <br />
      <h3>Sample of products</h3>
      <div class="product-container">
        <div
          v-for="product in dataProduct.products.slice(0, 20)"
          :key="product.id"
          class="product-card"
        >
          <div class="product-image">
            <img :src="product.images[0]" :alt="product.title" :srcSet="product.tumbnail" />
          </div>
          <div class="product-body">
            <p class="name">{{ product.title }}</p>
            <p class="desc">{{ product.description }}</p>
            <p class="price">{{ product.price }}$</p>
          </div>
        </div>
      </div>
      <br />
      <h3>Categories frecuencies</h3>
      <table className="table">
        <thead>
          <tr>
            <th>category</th>
            <th>count</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(value, key) in dataProduct?.meta?.categoryInfo" :key="key">
            <td>{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped lang="scss">
.table {
  border-collapse: collapse;
  width: 100%;
}
.table th,
.table td {
  padding: 5px;
  border: solid 1px #777;
}
.table th {
  background-color: lightblue;
}

.product-container {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.product-card {
  width: 180px;
  border-radius: 8px;
  box-shadow: 1px 1px 8px rgb(0 0 0 / 20%);
  .product-image {
    height: 100px;
    width: 100%;
    background: #fafafa;
    display: flex;
    flex-direction: row;
    justify-content: center;
    img {
      height: 100%;
      object-fit: contain;
    }
  }
  .product-body {
    padding: 8px;
    .name {
      margin: 2px 0px;
      font-size: 14px;
      font-weight: 600;
    }
    .desc {
      font-size: 12px;
      opacity: 0.7;
      margin: 0px;
      line-height: 1.2;
      line-break: anywhere;
    }
    .price {
      text-align: end;
      margin: 4px;
      font-weight: 600;
    }
  }
}
</style>
