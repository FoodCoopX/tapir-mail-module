/* eslint-disable react/jsx-wrap-multilines */
import React, { useState } from 'react';

import {
  EmailEditor,
  EmailEditorProvider,
  IEmailTemplate
} from 'easy-email-editor';
import 'easy-email-editor/lib/style.css';

import '@arco-themes/react-easy-email-theme/css/arco.css';
import { AdvancedType, BasicType, BlockManager, JsonToMjml } from 'easy-email-core';
import 'easy-email-editor/lib/style.css';
import { ExtensionProps, StandardLayout } from 'easy-email-extensions';
import 'easy-email-extensions/lib/style.css';
import mjml from 'mjml-browser';
import { Button } from 'react-bootstrap';
import { useWindowSize } from 'react-use';
import { Link } from 'react-router-dom';

//import './CustomBlocks';

const fontList = [
  'Arial',
  'Tahoma',
  'Verdana',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Lato',
  'Montserrat',
].map(item => ({ value: item, label: item }));

const categories: ExtensionProps['categories'] = [
  {
    label: 'Content',
    active: true,
    blocks: [
      {
        type: AdvancedType.TEXT,
      },
      {
        type: AdvancedType.IMAGE,
        payload: { attributes: { padding: '0px 0px 0px 0px' } },
      },
      {
        type: AdvancedType.BUTTON,
      },
      {
        type: AdvancedType.SOCIAL,
      },
      {
        type: AdvancedType.DIVIDER,
      },
      {
        type: AdvancedType.SPACER,
      },
      {
        type: AdvancedType.HERO,
      },
      {
        type: AdvancedType.WRAPPER,
      },
    ],
  },
  {
    label: 'Layout',
    active: true,
    displayType: 'column',
    blocks: [
      {
        title: '2 columns',
        payload: [
          ['50%', '50%'],
          ['33%', '67%'],
          ['67%', '33%'],
          ['25%', '75%'],
          ['75%', '25%'],
        ],
      },
      {
        title: '3 columns',
        payload: [
          ['33.33%', '33.33%', '33.33%'],
          ['25%', '25%', '50%'],
          ['50%', '25%', '25%'],
        ],
      },
      {
        title: '4 columns',
        payload: [['25%', '25%', '25%', '25%']],
      },
    ],
  },
];

const pageBlock = BlockManager.getBlockByType(BasicType.PAGE)!;


export default function Editor() {
  const [downloadFileName, setDownloadName] = useState('download.mjml');
  const [template, setTemplate] = useState<IEmailTemplate['content']>(pageBlock.create({
    data: {
      value: {
        "content-background-color": '#ffffff'
      }
    }
  }));

  const { width } = useWindowSize();

  const smallScene = width < 1400;

  const postHtmlToServer = (values: IEmailTemplate) => {
    const html = mjml(JsonToMjml({
      data: values.content,
      mode: 'production',
      context: values.content
    }), {
      beautify: true,
      validationLevel: 'soft',
    }).html;

    fetch('http://localhost:8000/api/demo/log_email_html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/html'
      },
      body: html
    }).then(res => {
      alert("OK")
    })
  };


  const initialValues = {
    subject: 'Welcome to Easy-email',
    subTitle: 'Nice to meet you!',
    content: BlockManager.getBlockByType(BasicType.PAGE)!.create({})
  };


  return (
    <div>
      <EmailEditorProvider
        dashed={false}
        data={initialValues}
        height={'calc(100vh - 85px)'}
        // onUploadImage={services.common.uploadByQiniu}

        autoComplete
        fontList={fontList}
        onSubmit={postHtmlToServer}
      >
        {({ values }, { submit }) => {
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1em' }}>
                <Link to="/"><Button variant='secondary'>Back</Button></Link>
                <Button onClick={() => postHtmlToServer(values)}>Send HTML to Django</Button>
              </div>
              <StandardLayout
                compact={!smallScene}
                categories={categories}
                showSourceCode={false}
              >
                <EmailEditor />
              </StandardLayout>
            </>
          );
        }}
      </EmailEditorProvider>
    </div>
  );
}