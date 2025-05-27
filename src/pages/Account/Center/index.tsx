import { PageContainer, ProField, ProFieldFCMode } from "@ant-design/pro-components"
import { useModel } from "@umijs/max";
import { Avatar, Card, Descriptions } from "antd"
import { isAbsolute } from "path";
import { useState } from "react";

const Center: React.FC = () => {
    const [state, setState] = useState<ProFieldFCMode>('read');
    const [plain, setPlain] = useState<boolean>(false);
    const { initialState } = useModel('@@initialState');
    const localUserStr = localStorage.getItem('currentUser');
    const currentUser = localUserStr ? JSON.parse(localUserStr) : null;

    return <PageContainer>
        <Card
            style={{
                borderRadius: 8,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 50
                }}
            >
                <Avatar size={128} src={<img src={"https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"} alt="avatar" />} />
                <span style={{ fontSize: 30, fontWeight: 'bold' }}>
                    {initialState?.currentUser?.name}
                </span>
            </div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 30,
                }}
            >
                <Descriptions column={2}>
                    <Descriptions.Item label="Username">
                        <ProField
                            text={currentUser?.name || 'N/A'}
                            valueType="text"
                            mode="read"
                        />
                    </Descriptions.Item>

                    <Descriptions.Item label="Email">
                        <ProField
                            text={currentUser?.email || 'N/A'}
                            valueType="text"
                            mode="read"
                        />
                    </Descriptions.Item>

                    <Descriptions.Item label="User ID">
                        <ProField
                            text={currentUser?.id?.toString() || 'N/A'}
                            valueType="text"
                            mode="read"
                        />
                    </Descriptions.Item>

                    {/* <Descriptions.Item label="Token">
                        <Paragraph copyable ellipsis={{ rows: 1, expandable: true, symbol: '更多' }}>
                            {currentUser?.token || 'N/A'}
                        </Paragraph>
                    </Descriptions.Item> */}
                </Descriptions>

            </div>

        </Card>
    </PageContainer>
}

export default Center