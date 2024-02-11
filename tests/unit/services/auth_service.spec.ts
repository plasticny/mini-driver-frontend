import * as auth_service from '@/services/auth_service'
import { webpage_api } from '@/services/api'
import { is_admin_ip } from '@/services/store'

jest.mock('@/services/api', () => {
  const api_check_admin_mock = jest.fn()
  api_check_admin_mock.mockResolvedValue({ data: false })

  return {
    webpage_api: {
      api_check_admin: api_check_admin_mock,
      api_check_admin_pass: jest.fn()
    }
  }
})

class fake_AuthService extends auth_service.AuthService {
  public set admin_status (status : auth_service.TAdminStatus) {
    this._admin_status = status
  }
  public reset () {
    this._admin_status = auth_service.IS_ADMIN_UNKNOWN
    this._admin_pass = undefined
  }
}

describe('auth_service', () => {
  const auth_service = new fake_AuthService()

  beforeEach(() => {
    auth_service.reset()
  })

  describe('check_admin_ip', () => {
    test('when is admin ip', async () => {
      webpage_api.api_check_admin = async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return { data: true }
      }
      const api_check_admin_spy = jest.spyOn(webpage_api, 'api_check_admin')

      await Promise.all([
        auth_service.check_admin_ip(),
        auth_service.check_admin_ip()
      ])
      expect(is_admin_ip.value).toBe(true)
      expect(api_check_admin_spy).toHaveBeenCalledTimes(1)
    })

    test('when not admin ip', async () => {
      webpage_api.api_check_admin = () => {
        return new Promise(resolve => {
          resolve({ data: false })
        })
      }
      await auth_service.check_admin_ip()
      expect(is_admin_ip.value).toBe(false)
    })
  })

  describe('check_admin_pass', () => {
    const api_check_admin_pass_mock = webpage_api.api_check_admin_pass as jest.Mock

    test('when admin pass undefined', async () => {
      auth_service.admin_pass = undefined
      expect(await auth_service.check_admin_pass()).toBe(false)
      expect(api_check_admin_pass_mock).not.toHaveBeenCalled()
    })

    test('when admin pass valid', async () => {
      auth_service.admin_pass = 'valid_pass'
      api_check_admin_pass_mock.mockResolvedValueOnce({ data: true })
      expect(await auth_service.check_admin_pass()).toBe(true)
      expect(api_check_admin_pass_mock).toHaveBeenCalledWith('valid_pass')
    })

    test('when admin pass invalid', async () => {
      auth_service.admin_pass = 'invalid_pass'
      api_check_admin_pass_mock.mockResolvedValueOnce({ data: false })
      expect(await auth_service.check_admin_pass()).toBe(false)
      expect(api_check_admin_pass_mock).toHaveBeenCalledWith('invalid_pass')
    })
  })
})
