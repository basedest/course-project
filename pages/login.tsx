import { GetServerSideProps } from "next"
import { signIn, useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/router"
import { ChangeEvent, useState } from "react"
import FormInput from "../components/FormInput"

const Login = ({callbackUrl}: {callbackUrl:string}) => {
  const router = useRouter()
  const { data: session } = useSession()

  if (session) {
    router.push(callbackUrl ?? '/')
  }

  const [message, setMessage] = useState('')
  const [values, setValues] = useState<any>({
    username: "",
    password: "",
  })

  const inputs = [
    {
      id: 1,
      name: "username",
      type: "text",
      placeholder: "Username",
      required: true,
    },
    {
      id: 2,
      name: "password",
      type: "password",
      placeholder: "Password",
      required: true,
    },
  ]

  const handleSubmit = (e:Event) => {
    e.preventDefault()
    const {username, password} = values
    fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({username, password}),
      headers: {
          'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        setMessage(data.error)
        return
      }
      signIn("credentials", {username, password})
    })
    .catch(e => setMessage(e))
  }

  const onChange = (e:ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
  }

  return (
    <div className="register">
      { message 
        ? <div><p>{message}</p><button onClick={(e) => setMessage('')}>ok</button></div>
        : <form onSubmit={handleSubmit as any}>
          <h1>Login</h1>
          {inputs.map((input) => (
            <FormInput
              key={input.id}
              {...input}
              value={values[input.name]}
              onChange={onChange}
            />
          ))}
          <button>Submit</button>
          <p>Not registered?{' '}
            <Link href={`/register${callbackUrl ? '?callbackUrl=' + callbackUrl : ''}`}>
              <a>Create an account</a>
            </Link>
          </p>
          </form>
      }
    </div>
  )
}

export default Login

export const getServerSideProps: GetServerSideProps = async (context) => {
  const callbackUrl = context.query.callbackUrl as string ?? null
  return {
    props: {callbackUrl}
  }
}