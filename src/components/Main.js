import React, { useCallback, useState, useEffect } from "react";
import "./Main.css";
import {
  Button,
  InputLabel,
  MenuItem,
  Select,
  Modal,
  Box,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useLazyQuery, useMutation, useQuery, gql } from "@apollo/client";
import { v4 as uuidv4 } from "uuid";
import { getAuth, signOut } from "firebase/auth";
const AWS = require("aws-sdk");
// Enter copied or downloaded access ID and secret key here

const ID = process.env.REACT_APP_ID;
const SECRET = process.env.REACT_APP_SECRET;
// The name of the bucket that you have created
const BUCKET_NAME = "attain-app-resources-bucket";
const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
});
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
const GET_ITEMS_AVAILABLE_DUFFL = gql`
  query ItemsAvailableDuffl(
    $businessId: ID
    $supplier: String
    $items: [ItemAvailableInput]
    $message: String
  ) {
    itemsAvailableDuffl(
      businessId: $businessId
      supplier: $supplier
      items: $items
      message: $message
    ) {
      item_id
      name
      mapped
      supplier
      quantity
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
  }
`;

const GET_USERS = gql`
  query Users($getUsersInput: GetUsersInput) {
    users(getUsersInput: $getUsersInput) {
      id
      name
      user_name
    }
  }
`;

function Main({ userId }) {
  const [fileData, setFileData] = useState([]);
  const [csvSuppliers, setCsvSuppliers] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [open, setOpen] = React.useState(false);
  const [store, setStore] = useState(7);
  const [supplier, setSupplier] = useState("");
  const [generateOrderLoading, setGenerateOrderLoading] = useState(false);
  const [filename, setFilename] = useState("");
  const [itemsDetail, setItemsDetail] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [getItemsAvailableDuffl, { loading, error, data }] = useLazyQuery(
    GET_ITEMS_AVAILABLE_DUFFL
  );
  const {
    loading: getUsersLoading,
    error: getUsersError,
    data: getUsersData,
  } = useQuery(GET_USERS, {
    variables: {
      getUsersInput: {
        ids: [userId],
      },
    },
  });

  const [
    importItemsToCart,
    {
      data: importItemsToCartData,
      loading: importItemsToCartLoading,
      error: importItemsToCartError,
    },
  ] = useMutation(IMPORT_ITEMS_TO_CART);

  const auth = getAuth();

  const suppliers = [
    "Mixed",
    "Pitco Foods",
    "Food Snacks",
    "HLA",
    "Wonder Ice Cream",
    "Coremark",
    "McLane",
    "Costco Business",
    "KeHE",
    "UNFI",
    "Amazon",
    "Pacific Beverage Co.",
    "AshaPops",
    "Pepsico",
    "Mel-O-Dee Ice Cream",
    "Frito Lay",
    "Prime Wholesale",
    "SnacksToYou",
    "Coca-Cola",
    "Jeff & Tony's Ice Cream",
    "Dippin Dots",
    "DropsofDough",
    "Ik Distributions LLC",
    "Taco Inc",
    "Guayaki",
    "LA DISTCO",
    "Quokka",
    "AZ Select Distribution",
    "Hensley",
    "Shamrock Foods",
    "Columbia Distributors",
    "Magic Ice Cube",
    "Walmart",
    "Southern Glazer's Wine and Spirits",
    "IK Distribution",
    "B2B - On Consignment",
    "Other",
    "UMPQUA Dairy",
    "Bend",
    "UNFI EO",
    "Soda Man USA",
    "Wall Street Distribution",
    "Jenis Ice Cream",
    "Handle",
    "Restaurant Depot",
    "Pressed Juicery",
    "Rancho Cold Brew",
    "Faire",
    "Mable",
    "GEMENI",
    "OCM",
    "RIVERA",
    "Capital Reyes Distributing",
    "Austin Wholesale Supply",
    "Sysco",
    "JFC",
    "Vistar",
    "Mipod Wholesale",
  ];

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };
  const generateOrder = async () => {
    setGenerateOrderLoading(true);

    let modifiedResults;
    if (supplier === "HLA") {
      modifiedResults = [...fileData].map((item) => ({
        name: item["{UPC}"],
        quantity: item["{QTY}"],
        upc: item["{UPC}"],
        supplier: "HLA",
      }));
    } else {
      modifiedResults = [...fileData].map((item) => ({
        name: item.product_name,
        quantity: item.total_packs_ordered,
        unit_size: item.pack_size,
        price: item.pack_price,
        upc: item.upc,
        supplier: item.supplier_name,
      }));
    }

    const distinctSuppliers = [
      ...new Set([...modifiedResults].map((item) => item.supplier)),
    ];
    setCsvSuppliers(
      distinctSuppliers.map((supplier) => {
        return {
          supplier: supplier,
          loading: false,
          submitted: false,
        };
      })
    );
    const params = {
      Bucket: BUCKET_NAME,
      Key: uuidv4() + ".csv",
      Body: uploadedFile,
    };

    try {
      const stored = await s3.upload(params).promise();
      const items = modifiedResults.map((item) => ({
        ...item,
        unit_size: parseInt(item.unit_size),
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
      }));

      await getItemsAvailableDuffl({
        variables: {
          businessId: store,
          supplier: supplier,
          items: items,
          message: stored.Location,
        },
      });
    } catch (error) {
      console.log(error);
    }

    setGenerateOrderLoading(false);
  };

  const importItems = async (selectedSupplier) => {
    setCsvSuppliers((prev) => {
      return prev.map((supplier) => {
        if (supplier.supplier === selectedSupplier) {
          return {
            ...supplier,
            loading: true,
          };
        }
        return supplier;
      });
    });

    let csvString;
    if (supplier === "HLA") {
      csvString = Papa.unparse([...fileData]);
    }
    csvString = Papa.unparse(
      fileData.filter((item) => item.supplier_name === selectedSupplier)
    );

    const params = {
      Bucket: BUCKET_NAME,
      ContentType: "text/csv",
      Key: uuidv4() + ".csv", // File name you want to save as in S3
      Body: csvString,
    };

    const supplierItemDetails = itemsDetail.filter(
      (item) => item.supplier === selectedSupplier
    );

    const itemsDetailInput = supplierItemDetails.map((item) => ({
      cartId: store,
      itemId: item.item_id,
      quantity: item.quantity,
    }));

    try {
      const stored = await s3.upload(params).promise();
      await importItemsToCart({
        variables: {
          importItemsToCartInput: {
            userId: store,
            itemsDetail: itemsDetailInput,
            message: stored.Location,
          },
        },
      });
      // handleCloseModal();
      // setOpen(true);

      setCsvSuppliers((prev) => {
        return prev.map((supplier) => {
          if (supplier.supplier === selectedSupplier) {
            return {
              ...supplier,
              loading: false,
              submitted: true,
            };
          }
          return supplier;
        });
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!loading && data) {
      const items = data.itemsAvailableDuffl;
      setItemsDetail(items);
      setModalVisible(true);
    }
  }, [data, loading]);

  useEffect(() => {
    if (!getUsersLoading && getUsersData) {
      setStore(getUsersData.users[0].id);
    }
  }, [getUsersData, getUsersLoading]);

  function Upload(props) {
    const onDrop = useCallback((acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        setUploadedFile(file);
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            setFileData(results.data);
            setFilename(file.name);
          },
        });
      });
    }, []);
    const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
      onDrop,
    });
    return (
      <section className="upload-container">
        <div {...getRootProps({ className: "dropzone" })}>
          <input {...getInputProps()} />
          <div className="upload-txt-wrap">
            <p
              style={{ color: "#888888", fontSize: "20px", fontWeight: "400" }}
            >
              Upload File Here
            </p>
            <CloudUploadOutlinedIcon
              style={{ color: "black", fontSize: "70px" }}
            />
          </div>
        </div>
        <aside>
          <h4>File</h4>
          <h2>{filename}</h2>
        </aside>
      </section>
    );
  }

  if (getUsersError) {
    return null;
  }
  if (getUsersLoading && !getUsersData) {
    return null;
  }

  return (
    <>
      <div className="main-bg">
        <Snackbar
          open={open}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          autoHideDuration={3000}
          onClose={handleClose}
        >
          <Alert
            onClose={handleClose}
            severity="success"
            sx={{ width: "500px" }}
          >
            <h4>
              Your order was submitted! Please check the Attain app track your
              order.
            </h4>
          </Alert>
        </Snackbar>
        <Modal onClose={handleCloseModal} open={modalVisible}>
          <Box
            style={{
              width: 500,
              height: 500,
              top: "50%",
              left: "50%",
              position: "absolute",
              backgroundColor: "white",
              border: "2px solid #000",
              boxShadow: 24,
              padding: 20,
              transform: "translate(-50%, -50%)",
            }}
          >
            <h1 style={{ marginBottom: 50 }}>
              {
                "Thanks! Your CSV file has been uploaded. Click below to submit your order."
              }
            </h1>
            {csvSuppliers.map((supplier) => {
              return (
                <Box
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3>{supplier.supplier}</h3>
                  {supplier.submitted ? (
                    <h3>Submitted</h3>
                  ) : (
                    <Button
                      onClick={() => importItems(supplier.supplier)}
                      variant="contained"
                      style={{ color: "#FFFFFF", backgroundColor: "#F05124" }}
                    >
                      {supplier.loading ? <CircularProgress /> : "Submit Order"}
                    </Button>
                  )}
                </Box>
              );
            })}

            <Box
              style={{
                position: "absolute",
                bottom: 20,
                left: 0,
                right: 0,
                textAlign: "center",
              }}
            >
              <Button
                onClick={handleCloseModal}
                variant="contained"
                style={{
                  width: "80%",
                  height: "40px",
                  color: "#FFFFFF",
                  backgroundColor: "#F05124",
                }}
              >
                Done
              </Button>
            </Box>
          </Box>
        </Modal>
        <div className="header">
          <p className="header-text">Attain CSV Ordering</p>
          <Button
            variant="contained"
            onClick={async () => await signOut(auth)}
            style={{ position: "absolute", top: 0, right: 15 }}
          >
            Log out
          </Button>
        </div>

        <div className="btn-wrapper">
          <div style={{ marginTop: 20 }}>
            <InputLabel id="demo-simple-select-label">Store</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              label="Select Store"
              className="dropdown"
              displayEmpty
              value={store}
              onChange={(event) => setStore(event.target.value)}
            >
              {getUsersData.users[0].id === "11" ? (
                [
                  { id: 7, name: "UC Berkeley" },
                  { id: 9, name: "UC Santa Barbara" },
                  { id: 10, name: "USC" },
                  { id: 11, name: "UCLA" },
                  { id: 12, name: "ASU" },
                  { id: 13, name: "UofA" },
                  { id: 20, name: "UT-Austin" },
                ].map((store) => (
                  <MenuItem value={store.id}>{store.name}</MenuItem>
                ))
              ) : (
                <MenuItem value={getUsersData.users[0].id}>
                  {getUsersData.users[0].name}
                </MenuItem>
              )}
            </Select>
          </div>
          <div style={{ marginTop: 10, marginBottom: 20 }}>
            <InputLabel id="demo-simple-select-label">Supplier</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              label="Select Store"
              className="dropdown"
              displayEmpty
              value={supplier}
              onChange={(event) => setSupplier(event.target.value)}
            >
              {suppliers.map((supplier) => {
                return <MenuItem value={supplier}>{supplier}</MenuItem>;
              })}
            </Select>
          </div>
          {supplier && <Upload />}
          <div style={{ marginTop: 20 }}>
            <Button
              onClick={generateOrder}
              variant="contained"
              style={{
                color: "#FFFFFF",
                backgroundColor: "#F05124",
                width: "305px",
                height: "50px",
              }}
            >
              {generateOrderLoading ? <CircularProgress /> : "GENERATE ORDER"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
