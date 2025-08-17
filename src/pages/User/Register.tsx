// src/pages/user/Register.tsx
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, history } from '@umijs/max';
import { message } from 'antd';
import React from 'react';
import axios from 'axios';

const Register: React.FC = () => {

    const handleRegister = async (values: any) => {
        if (values.password !== values.confirmPassword) {
            message.error('Passwords do not match');
            return;
        }

        try {
            const res = await axios.post('http://167.71.210.84:30080/users/api/user', {
                username: values.username,
                email: values.email,
                password: values.password
            });

            if (res.data.success) {
                const userId = res.data.data?.userId;

                if (!userId) {
                    message.error('Registration succeeded but userId not returned.');
                    return;
                }
                const loginRes = await axios.post('http://167.71.210.84:30080/users/login', {
                    username: values.username,
                    password: values.password,
                });

                const token = loginRes.data?.data;
                if (!token) {
                    message.error('Login after registration failed.');
                    return;
                }

                console.log(res)

                const assignRole = await axios.post('http://167.71.210.84:30080/users/api/user-roles', [{
                    id: 0,
                    userId: userId,
                    roleId: 7
                }],
                    {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        },
                    })

                message.success('Registration successful! Proceeding to face registration...');
                history.push(`/face-registration?userId=${userId}&token=${token}`);
            } else {
                message.error(res.data.message || 'Registration failed');
            }
        } catch (error) {
            message.error('Request failed. Please try again later.');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '80px auto' }}>
            <Helmet>
                <title>Register</title>
            </Helmet>
            <h2 style={{ textAlign: 'center' }}>Create Account</h2>
            <ProForm
                submitter={{
                    searchConfig: {
                        submitText: 'Register',
                    },
                }}
                onFinish={handleRegister}
            >
                <ProFormText
                    name="username"
                    fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
                    placeholder="Enter username"
                    rules={[{ required: true, message: 'Username is required' }]}
                />
                <ProFormText
                    name="email"
                    fieldProps={{ size: 'large', prefix: <MailOutlined /> }}
                    placeholder="Enter email"
                    rules={[
                        { required: true, message: 'Email is required' },
                        { type: 'email', message: 'Invalid email format' },
                    ]}
                />
                <ProFormText.Password
                    name="password"
                    fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                    placeholder="Enter password"
                    rules={[{ required: true, message: 'Password is required' }]}
                />
                <ProFormText.Password
                    name="confirmPassword"
                    fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                    placeholder="Confirm password"
                    rules={[
                        { required: true, message: 'Please confirm your password' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Passwords do not match'));
                            },
                        }),
                    ]}
                />
            </ProForm>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
                Already have an account?{' '}
                <a onClick={() => history.push('/user/login')}>Log in</a>
            </div>
        </div>
    );
};

export default Register;
