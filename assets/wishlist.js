"use strict";

const wishlist_items = JSON.parse(localStorage.getItem('bls__wishlist-items'));
const wishlistDiv = document.querySelector('.bls__wishlist-page-main');
var BlsWishlistPageShopify = (function() {
    return {
  
        initWishlistItems: function() {
            if (window.location.search.indexOf("page=") == -1) {
                this.init();
            }
        },
        
        init: function () {
            const _this = this;
            if (wishlistDiv) {
                const div_no_product = wishlistDiv.querySelector('.bls__wishlist-no-product-js');
                if (wishlist_items === null || wishlist_items.length === 0) {
                    _this.skeletonFunction(0)
                    div_no_product.classList.remove('d-none');
                }else{
                    var query = '';
                    wishlist_items.forEach((e, key, wishlist_items) => {
                        
                        if (!Object.is(wishlist_items.length - 1, key)) {
                        query += e+'%20OR%20handle:';
                        }
                        else{
                        query += e;
                        }
                    })

                    var productAjaxURL = "?view=wishlist&type=product&options[unavailable_products]=last&q=handle:"+query;

                    fetch(`${window.routes.search_url}${productAjaxURL}`)
                    .then(response => response.text())
                    .then((responseText) => {
                        const html = parser.parseFromString(responseText, 'text/html');
                        const row = document.createElement('div');
                        row.classList.add('row');
                        const exist_row = wishlistDiv.querySelector('.row');
                        if (exist_row) {
                            exist_row.remove();
                        }
                        const er = html.querySelector(".bls__wishlist-page-main > .row")
                        if(wishlist_items.length !== 0 && er){
                            wishlistDiv.innerHTML = html.querySelector(".bls__wishlist-page-main").innerHTML;
                            _this.skeletonFunction(700)

                        }else{
                            _this.skeletonFunction(0)
                            div_no_product.classList.remove('d-none');
                        }
                        _this.mergeItems();
                    }).catch((e) => {
                        console.error(e);
                    }).finally(e => {
                        BlsColorSwatchesShopify.init();
                        BlsSubActionProduct.handleInitQuickviewAction();
                        BlsSubActionProduct.init();
                        BlsLazyloadImg.init();
                    })
                }
            }
        },
        mergeItems: function () {
            const arr = [];
            if (wishlistDiv) {
                wishlistDiv.querySelectorAll(".bls__product-item").forEach(e => {
                    arr.push(e?.dataset.productHandle);
                })
            }
            localStorage.setItem('bls__wishlist-items',JSON.stringify(arr));
        },
        skeletonFunction: function (timer) {
            window.setTimeout(function() {
                if (this.document.querySelector('skeleton-page')) {
                    this.document.querySelector('skeleton-page').remove();
                }
                if (this.document.querySelector('.bls__wishlist-page-section-inner')) {
                    this.document.querySelector('.bls__wishlist-page-section-inner').classList.remove('d-none');
                }
            },timer)
        }
      }
  })();
  BlsWishlistPageShopify.initWishlistItems();