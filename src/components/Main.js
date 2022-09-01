import React from 'react'
import './Main.css'
import { Button, InputLabel, MenuItem, Select } from '@mui/material'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useDropzone } from 'react-dropzone'

function Main() {
    function Upload(props) {
        const { acceptedFiles, getRootProps, getInputProps } = useDropzone();

        const files = acceptedFiles.map(file => (
            <li key={file.path}>
                {file.path} - {file.size} bytes
            </li>
        ));

        return (
            <section className="upload-container">
                <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <div className='upload-txt-wrap'>
                        <p style={{ color: '#888888', fontSize: '20px', fontWeight: '400' }}>Upload File Here</p>
                        <CloudUploadOutlinedIcon style={{ color: 'black', fontSize: '70px' }} />
                    </div>
                </div>
            </section>
        );
    }


    return (
        <>
            <div className='main-bg'>
                <div className='center'>
                    <div className='outside'>
                        <div className='header'>
                            <p className='header-text'>Attain CSV Ordering</p>
                        </div>
                        <div className='btn-wrapper'>
                            <div>
                                <InputLabel id="demo-simple-select-label">Store</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    label="Select Store"
                                    className='dropdown'
                                    displayEmpty
                                    renderValue={(value) => (value ? value : <em>Select Store</em>)}
                                >
                                    <MenuItem value={1}>Store 1</MenuItem>
                                    <MenuItem value={2}>Store 2</MenuItem>
                                    <MenuItem value={3}>Store 3</MenuItem>
                                </Select>
                            </div>
                            <Upload />
                            <Button variant="contained" style={{
                                color: '#FFFFFF', backgroundColor: '#F05124', width: '305px', height: '69px', marginTop: '100px'
                            }}>GENERATE ORDER</Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Main