'use client' // for Next.js app router
import { IDKitWidget, VerificationLevel, ISuccessResult, IErrorState } from '@worldcoin/idkit'
import { verify } from './actions/verify'
import Button from '@mui/material/Button'

const app_id = process.env.NEXT_PUBLIC_WORLDID_CLIENT_ID as `app_${string}`
const action = process.env.NEXT_PUBLIC_WORLDID_ACTION

const VerifyWorldId = ({
  label,
  onSuccess,
  onError,
}: {
  label: string
  onSuccess: (result: ISuccessResult) => void
  onError: (error: IErrorState) => void
}) => {
  if (!app_id) {
    throw new Error('app_id is not set in environment variables!')
  }
  if (!action) {
    throw new Error('action is not set in environment variables!')
  }

  const handleVerify = async (result: ISuccessResult) => {
    console.log('Proof received from IDKit, sending to backend:\n', JSON.stringify(result)) // Log the proof from IDKit to the console for visibility
    const data = await verify(result)
    if (data.success) {
      console.log('Successful response from backend:\n', JSON.stringify(data)) // Log the response from our backend for visibility
    } else {
      throw new Error(`Verification failed: ${data.detail}`)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <IDKitWidget
        app_id={app_id} // obtained from the Developer Portal
        action={action} // obtained from the Developer Portal
        onSuccess={onSuccess} // callback when the modal is closed
        handleVerify={handleVerify} // callback when the proof is received
        onError={onError}
        verification_level={VerificationLevel.Device}
      >
        {({ open }) => (
          // This is the button that will open the IDKit modal
          <Button
            variant="outlined"
            size="medium"
            onClick={open}
          >
            {label}
          </Button>
        )}
      </IDKitWidget>
    </div>
  )
}

export default VerifyWorldId
