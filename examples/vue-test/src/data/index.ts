export type IProduct = {
  id: string;
  title: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  stock: number;
  tumbnail: string;
  images: [string];
};

export async function getProductsFromExternalApi(): Promise<{
  products: Array<IProduct>;
  meta: any;
}> {
  let limit: number = 25;
  let skip: number = 0;
  let fetchData = await fetch('https://dummyjson.com/products?limit=0');
  let total = (await fetchData.json()).total;
  let arrayPromises: Array<Promise<any>> = [];
  while (skip < total) {
    arrayPromises.push(fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`));
    skip = Math.min(skip + limit, total);
  }
  arrayPromises = (await Promise.all(arrayPromises)).map((el) => el.json());
  let allData: Array<IProduct> = (await Promise.all(arrayPromises)).reduce((acc, curr) => {
    const { products } = curr;
    acc = acc.concat(products);
    return acc;
  }, []);
  let output: { products: Array<IProduct>; meta: any } = {
    products: allData,
    meta: {},
  };
  //// do some proccessing //////
  output.meta = allData.reduce(
    (acc, curr) => {
      (acc.categoryInfo as any)[curr.category] =
        ((acc.categoryInfo as any)[curr.category] || 0) + 1;
      acc.lessThan3Rate = curr.rating < 3 ? acc.lessThan3Rate + 1 : acc.lessThan3Rate;
      acc.moreThan4Rate = curr.rating >= 3 ? acc.moreThan4Rate + 1 : acc.moreThan4Rate;
      if (curr.stock == 0) {
        (acc.productOutOfStock as any).push(acc);
      }
      return acc;
    },
    {
      categoryInfo: {},
      moreThan4Rate: 0,
      lessThan3Rate: 0,
      productOutOfStock: [],
    }
  );

  return output;
}
