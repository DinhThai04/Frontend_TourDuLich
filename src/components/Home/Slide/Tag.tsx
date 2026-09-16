import { Card, ConfigProvider } from "antd"
import type React from "react"

type IProps = {
   img: string, 
   title: string 
}

const Tag: React.FC<IProps> = ({img, title}) => {
  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <ConfigProvider theme={{
              components: {
                Card: {
                  bodyPadding: 15,
                },
              },
      }}>
        <Card
          hoverable
          style={{backgroundColor: '#daefff'}}  
        >
          <div
            style={{ width: 40, height: 40 }}        
            >
            <img
              alt={title}
              src={img}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
          </div>
        </Card>
      </ConfigProvider>
      <p style={{padding: '0 4px', fontSize: 14, fontWeight: 600, marginTop: 4, textAlign: 'center'}}>{title}</p>
    </div>
  )
}

export default Tag