import { useCallback, useEffect, useState } from 'react'
import './App.css'
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';


//TODO: put on .env
const API = "https://empreender.nyc3.cdn.digitaloceanspaces.com/static/";
const PAYMENT_API = "https://app.landingpage.com.br/api/checkoutloja/LPL2gc/5d87eb644e5631bc6a03f1e43a804e1c";

//future props
const productId = 'teste-prod-1.json';

//TODO Add in another file types.ts
interface IProduct {
  id: number;
  title: string;
  options: string[]; //TODO check with Santana about it
  values: string[][]; //TODO check with Santana about it
  variants: IVariant[];
  image_url: string;
  images: IImage[];
}

interface IImage {
  id: number;
  product_id: number;
  src: string;
}

interface IVariant {
  id: number;
  product_id: number;
  price: number;
  values: string[]; //TODO check with Santana about it
  image_id: number;
  inventory_quantity: number;
  image_url: string;
}

interface IBuyProduct {
  values: String[],
  quantity: number,
  product_id: number,
  variant_id: number,
}




function App() {
  const [product, setProduct] = useState<IProduct>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [variantByHash, setVariantByHash] = useState<Map<string, IVariant>>(new Map());
  const [quantity, setQuantity] = useState(1);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [errorQuantity, setErrorQuantity] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toastText, setToastText] = useState('')


  const hashVariant = useCallback((values: string[]) => {
    return values.join(',');
  }, []);

  const mapVariants = useCallback((variants: IVariant[]) => {
    const map = new Map<string, IVariant>();

    for (const variant of variants) {
      const hash = hashVariant(variant.values);
      map.set(hash, variant);
    }

    return map;
  }, []);

  const getProductData = useCallback(async () => {
    try {
      const response = await axios.get(API + productId);
      const data = response.data as IProduct;
      const defaultOptions = data.values.map((types) => types[0]);
      const variantByHash = mapVariants(data.variants);

      setProduct(data);
      setVariantByHash(variantByHash);
      setSelectedValues(defaultOptions);
    } catch (e) {
      console.error(e);
      setError(true);
      setToastText('Error ao carregar produto')
    } finally {
      setLoading(false);
    }

  }, []);

  useEffect(() => {
    getProductData();

  }, [getProductData]);

  const changeSelectValue = (value: string, i: number) => {
    setSelectedValues((prev) => {
      const prevCopy = [...prev];
      prevCopy[i] = value;
      return prevCopy;
    });
    setErrorQuantity(false);
  }

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
    setErrorQuantity(false);
  }


  const decreaseQuantity = () => {
    setQuantity((prev) => prev - 1 >= 1 ? prev - 1 : 1);
    setErrorQuantity(false);
  }

  const buy = async () => {
    const hash = hashVariant(selectedValues);
    const variant = variantByHash.get(hash);

    if (!variant || quantity > variant.inventory_quantity) {
      setErrorQuantity(true);
      setToastText('Não existe a quanitdade de itens no estoque')
      return;
    }

    try {
      const buyProduct: IBuyProduct = {
        variant_id: variant.id,
        values: variant.values,
        product_id: product?.id as number,
        quantity: quantity
      };

      await axios.post(PAYMENT_API, buyProduct);

      setSuccess(true);
    } catch (e) {
      setToastText('Error ao pagar')
      console.error(e);
    }

  }

  if (loading)
    return <>Loading...</>

  if (error || !product)
    return <>Error</>

  if (success)
    return <>Sucesso!</>

  return (

    <>
      <div className="overlay-nuvem active carregou">
        <div className="modal-buybutton-nuvem">

          <div className="produto-imagem">
            <img loading="lazy" data-componente="imagem" src={product?.image_url} alt={`imagem do produto`} />
          </div>

          <div className="produto-desc" produto-id="127809233">

            <div>
              <h1 className="produto-titulo" data-componente="titulo">{product.title}</h1>
            </div>

            <div className="produto-precos">
              <p data-componente="comparado" className="produto-preco-comparado">{product.variants[0].price}</p>
            </div>

            {/* <!-- variantes --> */}
            <div className="produto-opts">
              <div className="produtos-variantes">

                {/* TODO - extract components */}
                {product.options.map((option, i) => {
                  return (
                    <div className="produto-select" key={option}>
                      <span>{option}</span>

                      <select value={selectedValues[i]} onChange={
                        (event) => { changeSelectValue(event.target.value, i) }
                      }> {
                          product.values[i].map((value) => <option key={value} value={value}>{value}</option>)
                        }
                      </select>
                    </div>
                  )
                })}

              </div>
            </div>

            <div>Quantidade: {quantity}
              <div>
                <button onClick={decreaseQuantity}>-</button>
                <button onClick={increaseQuantity}>+</button>
              </div>

              {errorQuantity && (
                <div>Não quantidade selecionada em estoque</div>
              )

              }
            </div>

            <div className="produto-compra">
              <button className="btn-comprar btn" onClick={buy}><div className="text-btn">Comprar</div></button>
            </div>

          </div>

        </div>
      </div>

      <Snackbar
        open={!!toastText}
        onClose={() => setToastText('')}
        message={toastText}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}

      />

    </>

  )
}

export default App
