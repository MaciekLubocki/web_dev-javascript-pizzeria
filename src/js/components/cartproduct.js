import AmountWidget from './amountwidget.js';  
import {select} from '../settings.js'; 



class CartProduct{
  constructor(menuProduct,element){
    const thisCartProduct = this;
    thisCartProduct.id = menuProduct.id;
    thisCartProduct.name = menuProduct.name;
    thisCartProduct.price = menuProduct.price;
    thisCartProduct.priceSingle = menuProduct.priceSingle;
    thisCartProduct.amount = menuProduct.amount;
    thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));
    thisCartProduct.getElements(element);
    thisCartProduct.initAmountWidget();
    console.log('new CartProduct', thisCartProduct);
    console.log('productData', menuProduct);
  }

  getData(){

    const thisCartProduct = this;
    const productData = {
      id: thisCartProduct.id,
      price: thisCartProduct.price,
      amount:thisCartProduct.amount,
      priceSingle:thisCartProduct.priceSingle,
      params:thisCartProduct.params,
    };

    return productData;
  }


  remove() {
    const thisCartProduct = this;
    const event = new CustomEvent ('remove', {
      bubbles:true,
      detail: {
        cartProduct: thisCartProduct,
      },        

    });

    thisCartProduct.dom.wrapper.dispatchEvent(event);

  }



  initAmountWidget(){
    const thisCartProduct = this;
    thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
    thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
      thisCartProduct.amount = thisCartProduct.amountWidget.value;
      thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
      //console.log('thisCartProduct price is: ', thisCartProduct.price);
      thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
    });
  }


  getElements(element) {


    const thisCartProduct = this;

    thisCartProduct.dom = {};
    thisCartProduct.dom.wrapper = element;
    thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
    thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
    thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
    thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);

    thisCartProduct.dom.remove.addEventListener('click', function(event) {
      event.preventDefault();
      thisCartProduct.remove();
    });
  }
}

export default CartProduct;
