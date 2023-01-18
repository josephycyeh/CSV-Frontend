import React, {useCallback, useState, useEffect} from 'react'
import './Main.css'
import { Button, InputLabel, MenuItem, Select, Modal, Box, Snackbar, CircularProgress} from '@mui/material'
import LoadingButton from '@mui/lab/LoadingButton';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { useLazyQuery, useMutation,  gql } from '@apollo/client';
import { FixedSizeList as List } from 'react-window';
import { v4 as uuidv4 } from 'uuid';
const AWS = require('aws-sdk');
// Enter copied or downloaded access ID and secret key here

const ID = process.env.REACT_APP_ID
const SECRET = process.env.REACT_APP_SECRET
// The name of the bucket that you have created
const BUCKET_NAME = 'attain-app-resources-bucket';
const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET
});
const Alert = React.forwardRef(function Alert(
    props,
    ref,
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  
  const GET_ITEMS_AVAILABLE_DUFFL = gql`
  query ItemsAvailableDuffl($businessId: ID, $supplier: String, $items: [ItemAvailableInput], $message: String) {
    itemsAvailableDuffl(businessId: $businessId, supplier: $supplier, items: $items, message: $message) {
      item_id
      name
      mapped
    }
  }
`;

const IMPORT_ITEMS_TO_CART = gql`
mutation ImportItemsToCart($importItemsToCartInput: importItemsToCartInput!) {
    importItemsToCart(importItemsToCartInput: $importItemsToCartInput) {
      id
      cartItems {
        id
        name
        unit_size
        price
        upc1
        upc2
        nacs_category
        nacs_subcategory
        item_id
        quantity
        image
        supplier_code
        supplier
      }
      subtotal
    }
  }`

function Main() {

      
    const [file, setFile] = useState([])
    const [uploadedFile ,setUploadedFile] = useState(null)
    const [open, setOpen] = React.useState(false);
    const [store, setStore] = useState(7)
    const [supplier, setSupplier] = useState("Coremark")
    const [generateOrderLoading, setGenerateOrderLoading] = useState(false)
    const [importItemsLoading, setImportItemsLoading] = useState(false)
    const [filename, setFilename] = useState("")
    const [itemsDetail, setItemsDetail] = useState([])
    const [unavailableItemsDetail, setUnavailableItemsDetail] = useState([])
    const [modalVisible, setModalVisible] = useState(false)
    const [getItemsAvailableDuffl, { loading, error, data }] = useLazyQuery(GET_ITEMS_AVAILABLE_DUFFL);
    const [url, setUrl] = useState("")
    const [importItemsToCart, { data: importItemsToCartData, loading: importItemsToCartLoading, error: importItemsToCartError }] = useMutation(IMPORT_ITEMS_TO_CART);


    const suppliers = ["Pitco Foods", "Wonder Ice Cream", "Coremark", "McLane", "Costco Business", "KeHE", "UNFI", "Amazon", "Pacific Beverage Co.", "AshaPops", "Pepsico", "Mel-O-Dee Ice Cream", "Frito Lay", "Prime Wholesale", "SnacksToYou", "Coca-Cola", "Jeff & Tony's Ice Cream", "Dippin Dots", "DropsofDough", "Ik Distributions LLC", "Taco Inc", "Guayaki", "LA DISTCO", "Quokka", "AZ Select Distribution", "Hensley", "Shamrock Foods" ]
    const handleClose = () => {
        setOpen(false);
      };
    
    
      const handleCloseModal = () => {
          setModalVisible(false)
        
          
      }
    const generateOrder = async () => {
      setGenerateOrderLoading(true)
                        // Setting up S3 upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: uuidv4() + ".csv", // File name you want to save as in S3
      Body: uploadedFile
  };
  // Uploading files to the bucket
  try {
    const stored = await s3.upload(params).promise()
    setUrl(stored.Location)
    const items = Object.entries(file).map(([key, value]) => (
      {
        name: key,
        unit_size: parseInt(value.unit_size),
        price: parseFloat(value.price)
      }
    ))
    await getItemsAvailableDuffl({
      variables: {
          businessId: store,
          supplier: supplier,
          items: items,
          message: stored.Location
      }
    })
  }
  catch (error) {
    console.log(error)
  }

  setGenerateOrderLoading(false)
    }

    const importItems = async() => {
        setImportItemsLoading(true)
        try {
          const itemsDetailInput = itemsDetail.map((item) => (
            {
                cartId: store,
                itemId: item.item_id,
                quantity: parseInt(file[item.name].quantity)
            }
        ))
        console.log(itemsDetailInput)
        
       
        await importItemsToCart({
            variables: {
                "importItemsToCartInput": {
                  "userId": store,
                  "itemsDetail": itemsDetailInput,
                  "message": url
                }
              }
        })
        handleCloseModal()
        setOpen(true)
        } 
        catch (error) {
          console.log(error)
        }


        setImportItemsLoading(false)

    }


    const Row = ({ index, style }) => (
        <div style={style}>
            {unavailableItemsDetail[index].name}
        </div>
      );
   
    useEffect(() => {
        if (!loading && data) {
            const items = data.itemsAvailableDuffl
            const unavailableItems = items.filter((item) => item.mapped === false)
            setUnavailableItemsDetail(unavailableItems)
            setItemsDetail(items)
            setModalVisible(true)
        }
    }, [data, loading])
    
    function Upload(props) {
        const onDrop = useCallback((acceptedFiles) => {
            acceptedFiles.forEach((file) => {
                setUploadedFile(file)
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
  
                      var modifiedResults = results.data.reduce(function(map, obj) {
                        map[obj.product_name] = {
                            quantity: obj.total_packs_ordered,
                            unit_size: obj.pack_size,
                            price: obj.pack_price,
                        };
                        return map;
                    }, {});
                    setFile(modifiedResults)
                      setFilename(file.name)
                    },
                  });
            })
            
          }, [])

        const { acceptedFiles, getRootProps, getInputProps } = useDropzone({onDrop});
        return (
            <section className="upload-container" >
                <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <div className='upload-txt-wrap'>
                        <p style={{ color: '#888888', fontSize: '20px', fontWeight: '400' }}>Upload File Here</p>
                        <CloudUploadOutlinedIcon style={{ color: 'black', fontSize: '70px' }} />
                    </div>
                </div>
                  <aside>
        <h4>File</h4>
        <h2>{filename}</h2>
      </aside>
            </section>
        );
    }
    return (
        <>
            <div className='main-bg'>
            <Snackbar open={open} anchorOrigin={{ vertical: 'top', horizontal:'center' }} autoHideDuration={3000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: '500px' }}>
          <h4>Your order was imported into cart. Please check the Attain app to submit your order.</h4>
        </Alert>
      </Snackbar>
            <Modal onClose={handleCloseModal} open={modalVisible}>
                <Box style={{width: 500, height: 700, top: '50%',
  left: '50%', position: "absolute",  backgroundColor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  padding: 20, transform: 'translate(-50%, -50%)',}}>
                    <h1>{"Thanks! We have processed your order"}</h1>
                    <h2>The following items are unmapped, but we will still try to process them if possible:</h2>
                    <p style={{marginBottom: 50}}>*they will still appear in your cart</p>
                    <List
    height={400}
    itemCount={unavailableItemsDetail.length}
    itemSize={60}
    width={500}
  >
    {Row}
  </List>
                    <Button onClick={importItems} variant="contained" style={{
                                position: "absolute", bottom: 20, right: 20, color: '#FFFFFF', backgroundColor: '#F05124', width: '220px', height: '55px'
                            }}>{importItemsLoading ? <CircularProgress/> : 'Continue'}</Button>
                             <Button onClick={handleCloseModal} variant="contained" style={{
                                position: "absolute", bottom: 20, left  : 20, color: '#FFFFFF', backgroundColor: '#F05124', width: '150px', height: '55px',
                            }}>Cancel</Button>
                </Box>
            </Modal>
                        <div className='header'>
                            <p className='header-text'>Attain CSV Ordering</p>
                        </div>
  
                        <div className='btn-wrapper'>
                            <div style={{marginTop: 20}}>
                                <InputLabel id="demo-simple-select-label">Store</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    label="Select Store"
                                    className='dropdown'
                                    displayEmpty
                                    value={store}
                                    onChange={(event) => setStore(event.target.value)}                     
                                >
                                    <MenuItem value={7}>UC Berkeley</MenuItem>
                                    <MenuItem value={9}>UC Santa Barbara</MenuItem>
                                    <MenuItem value={10}>USC</MenuItem>
                                    <MenuItem value={11}>UCLA</MenuItem>
                                    <MenuItem value={12}>ASU</MenuItem>
                                    <MenuItem value={13}>UofA</MenuItem>
                                    <MenuItem value={1}>Attain Admin (Berkeley)</MenuItem>
                                    <MenuItem value={1}>Attain Admin (Berkeley)</MenuItem>
                                    <MenuItem value={17}>Snag Boulder</MenuItem>
                                </Select>
                            </div>
                            <div style={{marginTop: 10, marginBottom: 20}}>
                                <InputLabel id="demo-simple-select-label">Supplier</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    label="Select Store"
                                    className='dropdown'
                                    displayEmpty
                                    value={supplier}
                                    onChange={(event) => setSupplier(event.target.value)}
                                    
                                >
                                  {
                                    suppliers.map((supplier) => {
                                      return <MenuItem value={supplier}>{supplier}</MenuItem>
                                    })
                                  }
                                    
                                  
                                    
                                </Select>
                            </div>
                            <Upload />
                            <div style={{marginTop: 20}}>
                            <Button onClick={generateOrder} variant="contained" style={{
                                color: '#FFFFFF', backgroundColor: '#F05124', width: '305px', height: '50px'
                            }}>
                              
                              
                              { generateOrderLoading ? <CircularProgress /> : 'GENERATE ORDER'}
                              
                              </Button>
                            
                            </div>
                        </div>
            
            </div>
        </>
    )
}

export default Main