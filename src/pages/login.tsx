import axios from "axios";
// import validator from 'validator';
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@radix-ui/themes";
import { TextField } from "@radix-ui/themes";
import { Card, Flex, Text, Separator } from "@radix-ui/themes";
import { EyeOpenIcon, EyeClosedIcon } from "@radix-ui/react-icons";
import "@radix-ui/themes/styles.css";
import { useAuth } from "../hooks/authContext";



export default function Login() {
    const [usernameoremail, setusernameoremail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL;
    const { isAuthenticated, loading, setUser, setLoading } = useAuth();
    useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/timeline"); 
    }
    }, [isAuthenticated, loading]);
    if (loading) return;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log(usernameoremail, password);
            const response = await axios.post(`${apiUrl}/auth/login`, {
                usernameormail: usernameoremail,
                password
            },{
                withCredentials: true,
            });
            if (response.status === 200) {
                toast.success('Login successful!');

                const response = await axios.get(`${apiUrl}/auth/me`, { withCredentials: true });
                setUser(response.data.user);
                setLoading(false);

                navigate('/timeline');
                
            }
        } catch (error) {
            console.error('Login failed', error);
            toast.error('Login failed. Please check your credentials.');
        }
    };

    return ( 
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" style={{ minHeight: '100vh', backgroundColor: 'var(--gray-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Logo Section at top */}
            <Flex direction="column" align="center" pt="6" pb="6" style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 10 }}>
                <Text size="8" weight="bold" color="gray" mb="1">
                    Los Santos Media
                </Text>
            </Flex>

            {/* Bigger Centered Card */}
            <Card
            size="5"
            style={{
                width: '100%',
                maxWidth: 1000,
                minHeight: 600,
                padding: 0,
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                border: '1px solid var(--gray-6)',
                display: 'flex',
                flexDirection: 'row',
                gap: 0,
                overflow: 'hidden',
                background: ''
            }}
            >
            {/* Login Form */}
            <Flex direction="column" justify="center" p="8" style={{ flex: 1, minWidth: 0 }}>
                <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="5">
                    <Text size="6" weight="medium" mb="1" align="center">
                    Welcome back
                    </Text>
                    <Text size="3" color="gray" align="center" mb="3">
                    Sign in to continue
                    </Text>

                    <TextField.Root
                    size="3"
                    placeholder="Username or Email"
                    value={usernameoremail}
                    onChange={(e) => setusernameoremail(e.target.value)}
                    required
                    style={{
                        background: 'var(--gray-2)',
                        border: '1px solid var(--gray-5)'
                    } as any}
                    />

                    <TextField.Root
                    size="3"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                        background: 'var(--gray-2)',
                        border: '1px solid var(--gray-5)'
                    } as any}
                    >
                    <TextField.Slot side="right">
                        <Button
                        variant="ghost"
                        size="1"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ color: 'var(--gray-10)' }}
                        >
                        {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                        </Button>
                    </TextField.Slot>
                    </TextField.Root>

                    <Button
                    size="4"
                    type="submit"
                    style={{
                        width: '100%',
                        marginTop: '0.5rem'
                    }}
                    >
                    Sign In
                    </Button>

                    <Text
                    size="3"
                    color="blue"
                    align="center"
                    style={{ cursor: 'pointer', marginTop: '0.5rem' }}
                    onClick={() => navigate('/register')}
                    >
                    Don't have an account? Sign up
                    </Text>
                </Flex>
                </form>
            </Flex>

            {/* Divider */}
            <Flex align="stretch" style={{ height: '100%' }}>
                <Separator orientation="vertical" size="4" style={{ background: 'var(--gray-4)', width: 2, alignSelf: 'stretch' }} />
            </Flex>

            {/* Minimalist Info Section */}
            <Flex direction="column" justify="center" p="8" style={{ flex: 1, minWidth: 0, background: '' }}>
                <Text size="5" weight="medium" mb="2">
                About
                </Text>
                <Text size="3" color="gray" mb="2">
                Connect, share, and discover content in the Los Santos community.
                </Text>
                <Separator size="4" />
                <Flex direction="column" gap="3" mt="2">
                <Text size="3" color="gray">• Share media & stories</Text>
                <Text size="3" color="gray">• Connect with community</Text>
                <Text size="3" color="gray">• Discover local events</Text>
                <Text size="3" color="gray">• Manage your profile and preferences</Text>
                <Text size="3" color="gray">• Secure and private platform</Text>
                <Text size="3" color="gray">• Fast, modern, and easy-to-use interface</Text>
                </Flex>
                <Separator size="4" mt="4" mb="2" />
                <Text size="2" color="gray" mt="2">
                Need help? Visit our <a href="https://support.los-santos-media.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-10)', textDecoration: 'underline' }}>Support Center</a> or contact us at <a href="mailto:support@los-santos-media.com" style={{ color: 'var(--blue-10)', textDecoration: 'underline' }}>support@los-santos-media.com</a>.
                </Text>
            </Flex>
            </Card>
        </div>
    );
    
}