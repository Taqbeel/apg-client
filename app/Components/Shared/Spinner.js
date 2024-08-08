import React from 'react';
import { ImSpinner9 } from "react-icons/im";

const Spinner = (props) => <ImSpinner9 className='rotating' style={{color:props.color||'black'}} />

export default Spinner