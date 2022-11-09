import React, {useCallback, useState, useEffect} from 'react'
import './Main.css'
import { Button, InputLabel, MenuItem, Select, Modal, Box, Snackbar} from '@mui/material'
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
  query ItemsAvailableDuffl($items: [String], $message: String) {
    itemsAvailableDuffl(items: $items, message: $message) {
      item_id
      name
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
    const [filename, setFilename] = useState("")
    const [itemsDetail, setItemsDetail] = useState([])
    const [unavailableItemsDetail, setUnavailableItemsDetail] = useState([])
    const [modalVisible, setModalVisible] = useState(false)
    const [getItemsAvailableDuffl, { loading, error, data }] = useLazyQuery(GET_ITEMS_AVAILABLE_DUFFL);
    const [importItemsToCart, { data: importItemsToCartData, loading: importItemsToCartLoading, error: importItemsToCartError }] = useMutation(IMPORT_ITEMS_TO_CART);

    const handleClose = () => {
        setOpen(false);
      };
    
    
      const handleCloseModal = () => {
          setModalVisible(false)
        
          
      }
    const generateOrder = async () => {
        if (data) {
            setModalVisible(true)
        }
                        // Setting up S3 upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: uuidv4() + ".csv", // File name you want to save as in S3
      Body: uploadedFile
  };
  // Uploading files to the bucket
  const stored = await s3.upload(params).promise()

  getItemsAvailableDuffl({
    variables: {
        items: Object.keys(file),
        message: stored.Location
    }
  })
        

    }

    const importItems = () => {
        const itemsDetailInput = itemsDetail.map((item) => (
            {
                cartId: store,
                itemId: item.item_id,
                quantity: parseInt(file[item.name].quantity)
            }
        ))
        console.log(itemsDetailInput)
        
        importItemsToCart({
            variables: {
                "importItemsToCartInput": {
                  "userId": store,
                  "itemsDetail": itemsDetailInput
                }
              }
        })
        handleCloseModal()
        setOpen(true)
    }


    const Row = ({ index, style }) => (
        <div style={style}>
            {unavailableItemsDetail[index].name}
        </div>
      );
    
    useEffect(() => {
        if (!loading && data) {
            const items = data.itemsAvailableDuffl
            const unavailableItems = items.filter((item) => item.item_id === null)
            const availableItems = items.filter((item) => item.item_id !== null)
            setUnavailableItemsDetail(unavailableItems)
            setItemsDetail(availableItems)
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
                            quantity: obj.total_packs_ordered
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
            <section className="upload-container">
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
                    <h1>{"Thanks! We have processed " + itemsDetail.length + " out of " + Object.keys(file).length + " items." }</h1>
                    <h2 style={{marginBottom: 50}}>We are unable to fulfill the following items:</h2>
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
                            }}>Continue</Button>
                             <Button onClick={handleCloseModal} variant="contained" style={{
                                position: "absolute", bottom: 20, left  : 20, color: '#FFFFFF', backgroundColor: '#F05124', width: '150px', height: '55px',
                            }}>Cancel</Button>
                </Box>
            </Modal>
            <div className='header'>
                            <p className='header-text'>Attain CSV Ordering</p>
                        </div>
                <div className='center'>
    
                    <div className='outside'>
                      
                        <div className='btn-wrapper'>
                            <div>
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
                                    <MenuItem value={8}>UC Santa Barbara</MenuItem>
                                  
                                    
                                </Select>
                            </div>
                            <Upload />
                            <Button onClick={generateOrder} variant="contained" style={{
                                color: '#FFFFFF', backgroundColor: '#F05124', width: '305px', height: '10%'
                            }}>GENERATE ORDER</Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Main