import {settings, select, templates, classNames} from '../settings.js'; 
import utils from '../utils.js'; 
import CartProduct from './cartproduct.js';


class Cart {
  constructor(element) {
    const thisCart = this;
    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    // console.log('new Cart', thisCart);
       
  }


  update(){
    const thisCart = this;

    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (let product of thisCart.products) {
      thisCart.subtotalPrice += product.price;
      thisCart.totalNumber += product.amount;
    }

    if(thisCart.products.length > 0) {
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    } else {
      thisCart.totalPrice = 0;
    }
    console.log('thsCart.totalNumber', thisCart.totalNumber);
    console.log('thsCart.subtotalPrice', thisCart.subtotalPrice);
    console.log('thsCart.totalPrice', thisCart.totalPrice);

    for (let key of thisCart.renderTotalsKeys) {
      for (let elem of thisCart.dom[key]) {
        elem.innerHTML = thisCart[key];
      }
    }
  }


    
  add(menuProduct) {
    const thisCart = this;
    console.log('adding product', menuProduct);
    const generatedHTML = templates.cartProduct(menuProduct);
    console.log(generatedHTML);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    console.log(generatedDOM);
    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    console.log('thisCart.product', thisCart.products);
    thisCart.update();
  }
    
  
  getElements(element) {
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.form = document.querySelector(select.cart.form);
    thisCart.dom.productList = document.querySelector(select.cart.productList);
    thisCart.dom.form = document.querySelector(select.cart.form);
    thisCart.dom.phone = document.querySelector(select.cart.phone);
    thisCart.dom.address = document.querySelector(select.cart.address);

      
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];
    for(let key of thisCart.renderTotalsKeys){
      thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
    }
  }
   
  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function () { thisCart.update(); 
    });

    thisCart.dom.productList.addEventListener('remove', function () { thisCart.remove(event.detail.cartProduct); 
    });

    thisCart.dom.form.addEventListener('submit', function(){ 
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

 
  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.order;

    const payload = {
      phone : thisCart.dom.phone.value,
      address: thisCart.dom.address.value,            
      totalPrice : thisCart.totalPrice,
      subtotalPrice : thisCart.subtotalPrice,
      totalNumber : thisCart.totalNumber,
      deliveryFee : thisCart.deliveryFee,
      products: [], 
    };

    for (let product of thisCart.products) {

      product.getData();
      payload.products.push(product);
    }


      

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse', parsedResponse);
      });
  }


  


  
  remove(cartProduct) {
    const thisCart = this;
    const index = thisCart.products.indexOf(cartProduct);
    thisCart.products.splice(index, 1);
    cartProduct.dom.wrapper.remove();
    thisCart.update();
  }
 
}

export default Cart;


