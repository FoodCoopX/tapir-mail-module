/* eslint-disable react/jsx-wrap-multilines */
import React, { useEffect, useState } from 'react';

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
import { Button, Modal } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useWindowSize } from 'react-use';
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

const initialValues = {
  subject: 'Welcome to Easy-email',
  subTitle: 'Nice to meet you!',
};

export default function Editor() {
  const { templateName } = useParams();
  const [showSaveGateModal, setShowSaveGateModal] = useState(false);
  const [content, setContent] = useState(BlockManager.getBlockByType(BasicType.PAGE)!.create({}))
  const navigate = useNavigate();

  const { width } = useWindowSize();

  const smallScene = width < 1400;

  useEffect(() => {
    fetch(`http://localhost:8000/api/demo/templates/read/${templateName}`)
      .then(res => res.json()).then(data => {
        setContent(data)
      }).catch(err => {
        if (err.status === 404) {
          // new Design
        } else {
          console.error(err)
        }
      })

  }, [templateName])


  const handleBack = (values: IEmailTemplate) => {
    if (values.content != content) {
      setShowSaveGateModal(true);
    } else {
      navigate('/')
    }
  }

  const handleSave = (values: IEmailTemplate) => {
    setContent(values.content)
    const html: string = mjml(JsonToMjml({
      data: values.content,
      mode: 'production',
      context: values.content
    }), {
      beautify: false,
      validationLevel: 'soft',
    }).html.replaceAll('\n', '').replaceAll('\t', '').replaceAll('  ', '');

    fetch('http://localhost:8000/api/demo/templates/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/html'
      },
      body: JSON.stringify({
        name: templateName,
        json: values.content,
        html: html
      })
    }).then(res => {
      alert("Saved")
    })
  };

  const handleUploadImage = async (file: Blob) => {
    return new Promise<string>((resolve, reject) => {
      console.log(file) // TODO: upload file to server, return URL
    })
  }

  const handleCloseModal = () => setShowSaveGateModal(false);
  return (
    <>
      <Modal show={showSaveGateModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Achtung!</Modal.Title>
        </Modal.Header>
        <Modal.Body>Du hast <strong>ungespeicherte Änderungen</strong>!<br />Möchtest du deine Änderungen wirklich verwerfen?</Modal.Body>
        <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="danger" onClick={() => navigate('/')}>
            Änderungen verwerfen
          </Button>
          <Button variant="success" onClick={handleCloseModal}>
            Weiter Editieren
          </Button>
        </Modal.Footer>
      </Modal>

      <div>
        <EmailEditorProvider
          dashed={false}
          data={{ ...initialValues, content }}
          height={'calc(100vh)'}
          onUploadImage={handleUploadImage}
          autoComplete={false}
          fontList={fontList}
          onSubmit={handleSave}
          enabledLogic={false} // conditional blocks and stuff, interesting but maybe complex at the beginning
        // interactiveStyle={hoverColor:'#000000', selectedCorlor:'#000000'} <--- style the editor with CI colors
        // onAddCollection={(collection) => console.log(collection)}  <--- allows to save blocks to a collection for reuse
        // onRemoveCollection={(collection) => console.log(collection)}  <--- allows to remove blocks from a collection
        // mergeTags={mergeTags} // <--- allows to add tokens to the editor

        >
          {({ values }, { submit }) => {
            return (
              <>
                <StandardLayout
                  compact={!smallScene}
                  categories={categories}
                  showSourceCode={false}

                >
                  <EmailEditor />
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1em' }}>
                    <Button variant="secondary" onClick={() => handleBack(values)}>Zurück</Button>
                    <Button variant="success" onClick={() => handleSave(values)}>Speichern</Button>
                  </div>
                </StandardLayout>

              </>
            );
          }}
        </EmailEditorProvider>
      </div></>
  );
}