/* eslint-disable react/jsx-wrap-multilines */
import React from 'react';

import {
  EmailEditor,
  EmailEditorProvider,
  IEmailTemplate
} from 'easy-email-editor';
import 'easy-email-editor/lib/style.css';

import '@arco-themes/react-easy-email-theme/css/arco.css';
import { AdvancedType, BasicType, BlockManager } from 'easy-email-core';
import 'easy-email-editor/lib/style.css';
import { ExtensionProps, StandardLayout } from 'easy-email-extensions';
import 'easy-email-extensions/lib/style.css';
import { Button } from 'react-bootstrap';
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

type EditorProps = {
  handleBack?: (values: IEmailTemplate) => void;
  handleSave?: (values: IEmailTemplate) => void;
  content?: any;
  subject?: string;
  subtitle?: string;
  onContentChange?: (values: IEmailTemplate) => void;
}
const Editor: React.FC<EditorProps> = ({ handleBack, handleSave, onContentChange, subject, subtitle, content = BlockManager.getBlockByType(BasicType.PAGE)!.create({}) }) => {
  const { width } = useWindowSize();

  const smallScene = width < 1400;

  const handleUploadImage = async (file: Blob) => {
    return new Promise<string>((resolve, reject) => {
      console.log(file) // TODO: upload file to server, return URL
    })
  }
  
  return (
    <>

      <div>
        <EmailEditorProvider
          dashed={false}
          data={{ subject: subject, subtitle: subtitle, content: content }}
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
            if (onContentChange) {
              onContentChange(values);
            }
            return (
              <>
                <StandardLayout
                  compact={!smallScene}
                  categories={categories}
                  showSourceCode={false}

                >
                  <EmailEditor />
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1em' }}>
                    {handleBack && <Button variant="secondary" onClick={() => handleBack(values)}>Zurück</Button>}
                    {handleSave && <Button variant="success" onClick={() => handleSave(values)}>Speichern</Button>}
                  </div>
                </StandardLayout>

              </>
            );
          }}
        </EmailEditorProvider>
      </div></>
  );
}
export default Editor;